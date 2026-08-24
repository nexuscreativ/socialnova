/* SocialNova service worker — hand-rolled, no Workbox.
 * - Precache: shell (/, offline fallback)
 * - Static assets (_next/static, images, fonts): cache-first
 * - Navigations: network-first, fallback to cache → offline
 * - API (/api/): network-only
 * - Push: show notification (payload from /push/broadcast or event bus)
 */
const CACHE = "socialnova-v1"
const OFFLINE_URL = "/offline"
const PRECACHE = ["/", OFFLINE_URL]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => {})).then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

function isApiRequest(url) {
  return url.pathname.startsWith("/api/")
}
function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?|ttf|css|js)$/.test(url.pathname)
  )
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== "GET") return
  if (isApiRequest(url)) return // network-only for API
  if (isStaticAsset(url)) {
    // cache-first for static assets
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone()
              caches.open(CACHE).then((cache) => cache.put(request, clone))
            }
            return res
          })
          .catch(() => cached)
      }),
    )
    return
  }
  if (request.mode === "navigate") {
    // network-first for navigations
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE).then((cache) => cache.put(request, clone))
          return res
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)).then((r) => r || Response.error())),
    )
  }
})

// Web Push
self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: event.data ? event.data.text() : "SocialNova", body: "" }
  }
  const title = data.title || "SocialNova"
  const options = {
    body: data.body || data.message || "",
    icon: data.icon || "/icon-192x192.png",
    badge: "/icon-192x192.png",
    data: { url: data.url || "/" },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(self.location.origin) && "focus" in w) return w.focus()
      }
      return clients.openWindow(url)
    }),
  )
})
