"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Trash2, CheckCheck } from "lucide-react"

interface Note { id: string; title: string; description: string; time: Date; read: boolean }

export default function NotificationsCenterPage() {
  const [items, setItems] = useState<Note[]>([
    { id: "1", title: "Welcome to SocialNova", description: "Your live notifications will appear here via SSE (/api/v1/events).", time: new Date(), read: false },
    { id: "2", title: "Tip: Cmd+K", description: "Press Cmd+K to jump anywhere.", time: new Date(Date.now() - 60000 * 30), read: true },
  ])

  useEffect(() => {
    let es: EventSource | null = null
    try {
      es = new EventSource("/api/v1/events")
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === "heartbeat" || data.type === "connected") return
          setItems(prev => [{ id: `live-${Date.now()}`, title: data.title || data.type, description: data.body || "", time: new Date(), read: false }, ...prev].slice(0, 50))
        } catch {}
      }
    } catch {}
    return () => { try { es?.close() } catch {} }
  }, [])

  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, read: true })))
  const clear = () => setItems([])

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-plus-jakarta)" }}><Bell className="h-6 w-6" style={{ color: "var(--accent)" }} /> Notifications</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Live via <code>/api/v1/events</code> · {items.filter(n => !n.read).length} unread</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={markAllRead}><CheckCheck className="h-4 w-4 mr-1" /> Mark all read</Button>
          <Button variant="ghost" size="sm" onClick={clear}><Trash2 className="h-4 w-4 mr-1" /> Clear</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No notifications</p>
          ) : (
            items.map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg border" style={{ borderColor: "var(--border-default)", backgroundColor: n.read ? "transparent" : "var(--bg-tertiary)" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{n.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{n.description}</p>
                  <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>{n.time.toLocaleString()}</p>
                </div>
                {!n.read && <span className="h-2 w-2 rounded-full mt-2" style={{ backgroundColor: "var(--accent)" }} />}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
