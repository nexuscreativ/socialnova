"use client"
import { useEffect } from "react"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i)
  return out
}

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js").catch(() => {})

    // Web Push subscribe (M9) — best-effort, requires VAPID_PUBLIC_KEY to be set on the API
    if ("Notification" in window && "PushManager" in window) {
      Notification.requestPermission().catch(() => {})
      fetch("/api/push/vapidPublicKey", { cache: "no-store" })
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (!data?.vapidPublicKey) return
          if (Notification.permission !== "granted") return
          return navigator.serviceWorker.ready.then(reg =>
            reg.pushManager
              .subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(data.vapidPublicKey) })
              .then(sub =>
                fetch("/api/push/subscribe", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(sub.toJSON()),
                }).catch(() => {}),
              )
              .catch(() => {}),
          )
        })
        .catch(() => {})
    }

    // Real-time events SSE (M10) — keep a live EventSource to /api/v1/events for dashboard/notifications
    // The channel is auth-protected; the Next proxy forwards the cookie as Bearer.
    try {
      const es = new EventSource("/api/v1/events")
      es.onmessage = () => {}
      es.onerror = () => {
        // EventSource auto-reconnects; close on persistent error to avoid tight loop
        // (leave it open — browser will retry with backoff)
      }
      return () => es.close()
    } catch {
      return undefined
    }
  }, [])
  return null
}
