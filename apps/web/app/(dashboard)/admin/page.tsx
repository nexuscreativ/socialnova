"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Users,
  FileText,
  Megaphone,
  Bot,
  Activity,
  Key,
  ShieldAlert,
  Loader2,
  Search,
  Server,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/toast"

interface Stats {
  users: number
  content: number
  campaigns: number
  agent_sessions: number
  agent_actions: number
  api_requests: number
}

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  tier: string
  is_active: boolean
  is_verified: boolean
  created_at: string | null
}

interface ApiUsage {
  totals: {
    total_requests: number
    failed_requests: number
    total_tokens: number
    total_cost_cents: number
    avg_latency_ms: number
  }
  top_keys: {
    key_id: string
    key_name: string
    key_prefix: string
    owner_email: string
    requests: number
    tokens: number
    cost_cents: number
  }[]
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

interface Endpoint {
  path: string | null
  name: string | null
  methods: string[] | null
}

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

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed (${res.status})`)
  }
  return data
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export default function AdminPage() {
  const { addToast } = useToast()
  const [role, setRole] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  const [stats, setStats] = useState<Stats | null>(null)
  const [usage, setUsage] = useState<ApiUsage | null>(null)
  const [keys, setKeys] = useState<AdminKey[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [userTotal, setUserTotal] = useState(0)
  const [userPage, setUserPage] = useState(1)
  const [search, setSearch] = useState("")
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [showEndpoints, setShowEndpoints] = useState(false)
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [showAudit, setShowAudit] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadAccess = async () => {
    try {
      const me = await fetchJson("/api/auth/me")
      const r = me?.user?.role ?? me?.role ?? "user"
      setRole(r)
      setIsAdmin(r === "admin" || r === "superadmin")
      setIsSuperAdmin(r === "superadmin")
    } catch {
      setRole("user")
      setIsAdmin(false)
      setIsSuperAdmin(false)
    }
  }

  const loadAll = async () => {
    try {
      const [s, u, k, ep] = await Promise.all([
        fetchJson("/api/admin/stats"),
        fetchJson("/api/admin/api-usage?days=30"),
        fetchJson("/api/admin/api-keys"),
        fetchJson("/api/admin/endpoints"),
      ])
      setStats(s)
      setUsage(u)
      setKeys(k?.keys ?? [])
      setEndpoints(ep?.routes ?? [])
    } catch (err) {
      console.error("admin load error:", err)
      addToast(err instanceof Error ? err.message : "Failed to load admin data", "error")
    } finally {
      setLoading(false)
    }
  }

  const loadAudit = async () => {
    try {
      const data = await fetchJson("/api/admin/audit-logs?per_page=100")
      setAuditLogs(data.logs ?? [])
    } catch (err) {
      console.error("admin audit error:", err)
      addToast(err instanceof Error ? err.message : "Failed to load audit log", "error")
    }
  }

  const loadUsers = async (page: number, query: string) => {
    try {
      const q = query ? `&search=${encodeURIComponent(query)}` : ""
      const data = await fetchJson(`/api/admin/users?page=${page}&per_page=10${q}`)
      setUsers(data.users ?? [])
      setUserTotal(data.total ?? 0)
    } catch (err) {
      console.error("admin users error:", err)
    }
  }

  useEffect(() => {
    loadAccess()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      loadAll()
    }
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) loadUsers(userPage, search)
  }, [isAdmin, userPage])

  const toggleUser = async (u: AdminUser) => {
    try {
      const data = await fetchJson(`/api/admin/users/${u.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !u.is_active }),
      })
      addToast(data?.ok ? "User status updated" : "Update failed", data?.ok ? "success" : "error")
      loadUsers(userPage, search)
    } catch (err) {
      console.error("toggle user error:", err)
      addToast(err instanceof Error ? err.message : "Failed to update user", "error")
    }
  }

  const changeRole = async (u: AdminUser, target: string) => {
    if (u.role === target) return
    try {
      const data = await fetchJson(`/api/admin/users/${u.id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: target }),
      })
      addToast(
        `${u.email} role → ${data?.role ?? target}`,
        data?.ok ? "success" : "error",
      )
      loadUsers(userPage, search)
    } catch (err) {
      console.error("change role error:", err)
      addToast(err instanceof Error ? err.message : "Failed to update role", "error")
    }
  }

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
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 15%, transparent)" }}
        >
          <ShieldAlert className="h-7 w-7" style={{ color: "var(--color-error)" }} />
        </div>
        <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
          Access denied
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Admin privileges required to view this page.
        </p>
        <Badge variant="default">{role}</Badge>
      </div>
    )
  }

  const statCards: { label: string; value: number; icon: typeof Activity }[] = [
    { label: "Users", value: stats?.users ?? 0, icon: Users },
    { label: "Content", value: stats?.content ?? 0, icon: FileText },
    { label: "Campaigns", value: stats?.campaigns ?? 0, icon: Megaphone },
    { label: "Agent Sessions", value: stats?.agent_sessions ?? 0, icon: Bot },
    { label: "Agent Actions", value: stats?.agent_actions ?? 0, icon: Activity },
    { label: "API Requests", value: stats?.api_requests ?? 0, icon: Key },
  ]

  const totalPages = Math.max(1, Math.ceil(userTotal / 10))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
          Admin
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          System stats, API usage, and user management
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(card => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className="h-4 w-4" style={{ color: "var(--accent)" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{card.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                {card.value.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API usage */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <div>
              <CardTitle>API Usage (last 30 days)</CardTitle>
              <CardDescription>Aggregated across all users and keys</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Requests</p>
              <p className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                {(usage?.totals.total_requests ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Failed</p>
              <p className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                {(usage?.totals.failed_requests ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Tokens</p>
              <p className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                {(usage?.totals.total_tokens ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Cost</p>
              <p className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                {money(usage?.totals.total_cost_cents ?? 0)}
              </p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Avg latency</p>
              <p className="text-xl font-bold mt-1" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                {Math.round(usage?.totals.avg_latency_ms ?? 0)}ms
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              Top API keys
            </h4>
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
                        <td className="py-2.5">
                          <span className="font-medium" style={{ color: "var(--text-primary)" }}>{k.key_name}</span>
                          <span className="ml-2 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                            {k.key_prefix}•••
                          </span>
                        </td>
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

      {/* Users */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: "var(--accent)" }} />
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>{userTotal} total</CardDescription>
              </div>
            </div>
            <div className="relative">
              <Search
                className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <Input
                className="pl-9"
                placeholder="Search by email"
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setUserPage(1)
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") loadUsers(userPage, search)
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: "var(--text-muted)" }}>
                  <th className="text-left font-medium py-2">User</th>
                  <th className="text-left font-medium py-2">Role</th>
                  <th className="text-left font-medium py-2">Joined</th>
                  <th className="text-left font-medium py-2">Status</th>
                  <th className="text-right font-medium py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderTop: "1px solid var(--border-default)" }}>
                    <td className="py-2.5">
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>{u.name || u.email}</span>
                      <span className="block text-xs" style={{ color: "var(--text-muted)" }}>{u.email}</span>
                    </td>
                    <td className="py-2.5">
                      <Badge variant={u.role === "superadmin" ? "warning" : u.role === "admin" ? "info" : "default"}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-2.5" style={{ color: "var(--text-secondary)" }}>{fmtDate(u.created_at)}</td>
                    <td className="py-2.5">
                      <Badge variant={u.is_active ? "success" : "error"}>{u.is_active ? "Active" : "Disabled"}</Badge>
                    </td>
                    <td className="py-2.5">
                      <div className="flex justify-end gap-2">
                        {isSuperAdmin && (
                          <select
                            value={u.role}
                            onChange={e => changeRole(u, e.target.value)}
                            className="h-8 rounded-md border bg-transparent px-2 text-xs"
                            style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                            aria-label={`Change role for ${u.email}`}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                            <option value="superadmin">superadmin</option>
                          </select>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => toggleUser(u)}>
                          {u.is_active ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center" style={{ color: "var(--text-muted)" }}>
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center">
            <Pagination
              currentPage={userPage}
              totalPages={totalPages}
              onPageChange={page => setUserPage(page)}
            />
          </div>
        </CardContent>
      </Card>

      {/* API keys overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <div>
              <CardTitle>All API Keys</CardTitle>
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
                    <td className="py-2.5">
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>{k.name}</span>
                      <span className="ml-2 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                        {k.key_prefix}•••
                      </span>
                    </td>
                    <td className="py-2.5" style={{ color: "var(--text-secondary)" }}>{k.owner_email}</td>
                    <td className="py-2.5 text-right">{money(k.daily_budget_cents)}</td>
                    <td className="py-2.5 text-right">{k.rate_limit}/min</td>
                    <td className="py-2.5" style={{ color: "var(--text-secondary)" }}>{fmtDate(k.last_used_at)}</td>
                    <td className="py-2.5">
                      <Badge variant={k.is_active ? "success" : "error"}>{k.is_active ? "Active" : "Revoked"}</Badge>
                    </td>
                  </tr>
                ))}
                {keys.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center" style={{ color: "var(--text-muted)" }}>
                      No API keys created yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card>
        <CardHeader>
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setShowEndpoints(v => !v)}
          >
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" style={{ color: "var(--accent)" }} />
              <div>
                <CardTitle>Registered Endpoints</CardTitle>
                <CardDescription>{endpoints.length} routes on the API</CardDescription>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${showEndpoints ? "rotate-180" : ""}`} />
          </button>
        </CardHeader>
        {showEndpoints && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <CardContent>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: "var(--text-muted)" }}>
                      <th className="text-left font-medium py-2">Method(s)</th>
                      <th className="text-left font-medium py-2">Path</th>
                      <th className="text-left font-medium py-2">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoints.map((ep, i) => (
                      <tr key={i} style={{ borderTop: "1px solid var(--border-default)" }}>
                        <td className="py-1.5">
                          <div className="flex flex-wrap gap-1">
                            {(ep.methods ?? []).map(m => (
                              <Badge key={m} variant="default">{m}</Badge>
                            ))}
                          </div>
                        </td>
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

      {/* Audit log */}
      <Card>
        <CardHeader>
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => {
              setShowAudit(v => {
                if (!v) loadAudit()
                return !v
              })
            }}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" style={{ color: "var(--accent)" }} />
              <div>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>{auditLogs.length} recent security events</CardDescription>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${showAudit ? "rotate-180" : ""}`} />
          </button>
        </CardHeader>
        {showAudit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <CardContent>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
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
                    {auditLogs.map(entry => (
                      <tr key={entry.id} style={{ borderTop: "1px solid var(--border-default)" }}>
                        <td className="py-1.5 font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {entry.action}
                        </td>
                        <td className="py-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                          {entry.user_email ?? entry.user_id ?? "system"}
                        </td>
                        <td className="py-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                          {entry.resource_type ? `${entry.resource_type}:${entry.resource_id ?? ""}` : "—"}
                        </td>
                        <td className="py-1.5 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                          {entry.ip_address ?? "—"}
                        </td>
                        <td className="py-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                          {entry.created_at ? new Date(entry.created_at).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center" style={{ color: "var(--text-muted)" }}>
                          No audit events recorded yet
                        </td>
                      </tr>
                    )}
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