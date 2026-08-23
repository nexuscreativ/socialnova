"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Activity, Key, Server, ChevronDown, Loader2, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"

interface ApiUsage {
  totals: { total_requests: number; failed_requests: number; total_tokens: number; total_cost_cents: number; avg_latency_ms: number }
  top_keys: { key_id: string; key_name: string; key_prefix: string; owner_email: string; requests: number; tokens: number; cost_cents: number }[]
}
interface AdminKey {
  id: string
  name: string
  key_prefix: string
  owner_email: string
  rate_limit: number
  daily_budget_cents: number
  is_active: boolean
  last_used_at: string | null
  created_at: string
}
interface Endpoint { path: string | null; name: string | null; methods: string[] | null }

async function fetchJson(url: string) {
  const res = await fetch(url)
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`)
  return data
}
function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}
function money(cents: number) { return `$${(cents / 100).toFixed(2)}` }

export default function AdminApiPage() {
  const { addToast } = useToast()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [usage, setUsage] = useState<ApiUsage | null>(null)
  const [keys, setKeys] = useState<AdminKey[]>([])
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [showEndpoints, setShowEndpoints] = useState(false)
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
  useEffect(() => {
    if (!isAdmin) return
    Promise.all([
      fetchJson("/api/admin/api-usage?days=30"),
      fetchJson("/api/admin/api-keys"),
      fetchJson("/api/admin/endpoints"),
    ])
      .then(([u, k, ep]) => {
        setUsage(u)
        setKeys(k?.keys ?? [])
        setEndpoints(ep?.routes ?? [])
      })
      .catch(err => addToast(err instanceof Error ? err.message : "Failed to load API data", "error"))
      .finally(() => setLoading(false))
  }, [isAdmin])

  if (isAdmin === null || loading) {
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
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>API</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Platform-wide usage, keys, and registered endpoints</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <div>
              <CardTitle>Usage — last 30 days</CardTitle>
              <CardDescription>Aggregated across all users and keys</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Requests</p>
              <p className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-plus-jakarta)" }}>{(usage?.totals.total_requests ?? 0).toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Failed</p>
              <p className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-plus-jakarta)" }}>{(usage?.totals.failed_requests ?? 0).toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Tokens</p>
              <p className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-plus-jakarta)" }}>{(usage?.totals.total_tokens ?? 0).toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Cost</p>
              <p className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-plus-jakarta)" }}>{money(usage?.totals.total_cost_cents ?? 0)}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Avg latency</p>
              <p className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-plus-jakarta)" }}>{Math.round(usage?.totals.avg_latency_ms ?? 0)}ms</p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ fontFamily: "var(--font-plus-jakarta)" }}>Top API keys</h4>
            {(usage?.top_keys ?? []).length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No key activity in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: "var(--text-muted)" }}>
                      <th className="text-left font-medium py-2">Key</th>
                      <th className="text-left font-medium py-2">Owner</th>
                      <th className="text-right font-medium py-2">Requests</th>
                      <th className="text-right font-medium py-2">Tokens</th>
                      <th className="text-right font-medium py-2">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(usage?.top_keys ?? []).map(k => (
                      <tr key={k.key_id} style={{ borderTop: "1px solid var(--border-default)" }}>
                        <td className="py-2.5"><span className="font-medium" style={{ color: "var(--text-primary)" }}>{k.key_name}</span><span className="ml-2 font-mono text-xs" style={{ color: "var(--text-muted)" }}>{k.key_prefix}•••</span></td>
                        <td className="py-2.5" style={{ color: "var(--text-secondary)" }}>{k.owner_email}</td>
                        <td className="py-2.5 text-right">{k.requests.toLocaleString()}</td>
                        <td className="py-2.5 text-right">{k.tokens.toLocaleString()}</td>
                        <td className="py-2.5 text-right">{money(k.cost_cents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <div>
              <CardTitle>All API keys</CardTitle>
              <CardDescription>{keys.length} keys across all users</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: "var(--text-muted)" }}>
                  <th className="text-left font-medium py-2">Key</th>
                  <th className="text-left font-medium py-2">Owner</th>
                  <th className="text-right font-medium py-2">Budget/day</th>
                  <th className="text-right font-medium py-2">Rate limit</th>
                  <th className="text-left font-medium py-2">Last used</th>
                  <th className="text-left font-medium py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id} style={{ borderTop: "1px solid var(--border-default)" }}>
                    <td className="py-2.5"><span className="font-medium" style={{ color: "var(--text-primary)" }}>{k.name}</span><span className="ml-2 font-mono text-xs" style={{ color: "var(--text-muted)" }}>{k.key_prefix}•••</span></td>
                    <td className="py-2.5" style={{ color: "var(--text-secondary)" }}>{k.owner_email}</td>
                    <td className="py-2.5 text-right">{money(k.daily_budget_cents)}</td>
                    <td className="py-2.5 text-right">{k.rate_limit}/min</td>
                    <td className="py-2.5" style={{ color: "var(--text-secondary)" }}>{fmtDate(k.last_used_at)}</td>
                    <td className="py-2.5"><Badge variant={k.is_active ? "success" : "error"}>{k.is_active ? "Active" : "Revoked"}</Badge></td>
                  </tr>
                ))}
                {keys.length === 0 && (<tr><td colSpan={6} className="py-6 text-center" style={{ color: "var(--text-muted)" }}>No API keys created yet</td></tr>)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <button className="flex items-center justify-between w-full text-left" onClick={() => setShowEndpoints(v => !v)}>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" style={{ color: "var(--accent)" }} />
              <div><CardTitle>Registered endpoints</CardTitle><CardDescription>{endpoints.length} routes</CardDescription></div>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${showEndpoints ? "rotate-180" : ""}`} />
          </button>
        </CardHeader>
        {showEndpoints && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <CardContent>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead><tr style={{ color: "var(--text-muted)" }}><th className="text-left font-medium py-2">Method(s)</th><th className="text-left font-medium py-2">Path</th><th className="text-left font-medium py-2">Name</th></tr></thead>
                  <tbody>
                    {endpoints.map((ep, i) => (
                      <tr key={i} style={{ borderTop: "1px solid var(--border-default)" }}>
                        <td className="py-1.5"><div className="flex flex-wrap gap-1">{(ep.methods ?? []).map(m => (<Badge key={m} variant="default">{m}</Badge>))}</div></td>
                        <td className="py-1.5 font-mono text-xs" style={{ color: "var(--text-primary)" }}>{ep.path}</td>
                        <td className="py-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>{ep.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </motion.div>
        )}
      </Card>
    </div>
  )
}
