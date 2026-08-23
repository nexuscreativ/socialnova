"use client"
import { useEffect, useState } from "react"
import { Loader2, ShieldAlert, Plug, Database, HardDrive, CreditCard, Bot, Mail, Webhook } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

type HealthStatus = "ok" | "warning" | "error"
interface Integration {
  id: string
  name: string
  status: HealthStatus
  detail: string
  configured: boolean
  meta: Record<string, unknown>
}

const ICONS: Record<string, typeof Database> = {
  database: Database,
  redis: Database,
  storage: HardDrive,
  stripe: CreditCard,
  openrouter: Bot,
  email: Mail,
  social_webhooks: Webhook,
}

function statusVariant(s: HealthStatus): "success" | "warning" | "error" {
  if (s === "ok") return "success"
  if (s === "warning") return "warning"
  return "error"
}
function statusLabel(s: HealthStatus) {
  if (s === "ok") return "Operational"
  if (s === "warning") return "Not configured"
  return "Error"
}
async function fetchJson(url: string) {
  const res = await fetch(url)
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`)
  return data
}

export default function AdminIntegrationsPage() {
  const { addToast } = useToast()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [overall, setOverall] = useState<HealthStatus>("ok")
  const [items, setItems] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJson("/api/auth/me")
      .then(me => {
        const r = me?.user?.role ?? me?.role ?? "user"
        setRole(r)
        setIsAdmin(r === "admin" || r === "superadmin")
      })
      .catch(() => {
        setRole("user")
        setIsAdmin(false)
      })
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchJson("/api/admin/integrations")
      setOverall(data.overall ?? "ok")
      setItems(data.integrations ?? [])
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load integrations", "error")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin])

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    )
  }
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 15%, transparent)" }}>
          <ShieldAlert className="h-7 w-7" style={{ color: "var(--color-error)" }} />
        </div>
        <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>Access denied</h2>
        <Badge variant="default">{role}</Badge>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>Integrations</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Third-party services — overall: <Badge variant={statusVariant(overall)}>{statusLabel(overall)}</Badge>
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plug className="h-4 w-4 mr-1.5" />}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => {
            const Icon = ICONS[item.id] ?? Plug
            return (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)" }}>
                        <Icon className="h-4 w-4" style={{ color: "var(--accent)" }} />
                      </div>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                    </div>
                    <Badge variant={statusVariant(item.status)}>{statusLabel(item.status)}</Badge>
                  </div>
                  <CardDescription className="mt-2">{item.detail}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                    {Object.entries(item.meta ?? {}).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="shrink-0" style={{ color: "var(--text-secondary)" }}>{k}:</span>
                        <span className="truncate">{String(v ?? "—")}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <span style={{ color: "var(--text-secondary)" }}>configured:</span>
                      <span>{item.configured ? "yes" : "no"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
          <p>• Secrets are masked; only prefix fragments are shown.</p>
          <p>• No outbound network calls are made from the health check — it stays fast and avoids leaking timing.</p>
          <p>• Set env vars (e.g. <code>STRIPE_SECRET_KEY</code>, <code>OPENROUTER_API_KEY</code>, <code>SMTP_HOST</code>) and redeploy the API to clear warnings.</p>
        </CardContent>
      </Card>
    </div>
  )
}
