"use client"
import { useEffect, useState } from "react"
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/toast"

interface AuditEntry {
  id: string
  action: string
  user_id: string | null
  user_email: string | null
  resource_type: string | null
  resource_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string | null
}

async function fetchJson(url: string) {
  const res = await fetch(url)
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`)
  return data
}

export default function AdminAuditPage() {
  const { addToast } = useToast()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [actions, setActions] = useState<{ action: string; count: number }[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState<string>("")
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

  const load = async (p: number, act: string) => {
    setLoading(true)
    try {
      const q = act ? `&action=${encodeURIComponent(act)}` : ""
      const data = await fetchJson(`/api/admin/audit-logs?page=${p}&per_page=50${q}`)
      setLogs(data.logs ?? [])
      setActions(data.actions ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load audit log", "error")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (isAdmin) load(page, actionFilter)
  }, [isAdmin, page, actionFilter])

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

  const totalPages = Math.max(1, Math.ceil(total / 50))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>Audit Log</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{total} events — filter by action, paginated</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={e => {
              setActionFilter(e.target.value)
              setPage(1)
            }}
            className="h-9 rounded-md border bg-transparent px-3 text-sm"
            style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}
            aria-label="Filter by action"
          >
            <option value="">All actions</option>
            {actions.map(a => (
              <option key={a.action} value={a.action}>
                {a.action} ({a.count})
              </option>
            ))}
          </select>
          <Button variant="secondary" size="sm" onClick={() => load(page, actionFilter)}>Refresh</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <div>
              <CardTitle>Security events</CardTitle>
              <CardDescription>Newest first · {logs.length} on this page</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--text-muted)" }} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: "var(--text-muted)" }}>
                    <th className="text-left font-medium py-2">Action</th>
                    <th className="text-left font-medium py-2">User</th>
                    <th className="text-left font-medium py-2">Resource</th>
                    <th className="text-left font-medium py-2">IP</th>
                    <th className="text-left font-medium py-2">When</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(entry => (
                    <tr key={entry.id} style={{ borderTop: "1px solid var(--border-default)" }}>
                      <td className="py-1.5 font-mono text-xs" style={{ color: "var(--text-primary)" }}>{entry.action}</td>
                      <td className="py-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>{entry.user_email ?? entry.user_id ?? "system"}</td>
                      <td className="py-1.5 text-xs" style={{ color: "var(--text-muted)" }}>{entry.resource_type ? `${entry.resource_type}:${entry.resource_id ?? ""}` : "—"}</td>
                      <td className="py-1.5 font-mono text-xs" style={{ color: "var(--text-muted)" }}>{entry.ip_address ?? "—"}</td>
                      <td className="py-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>{entry.created_at ? new Date(entry.created_at).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>No audit events for this filter</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-center mt-4">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={p => setPage(p)} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
