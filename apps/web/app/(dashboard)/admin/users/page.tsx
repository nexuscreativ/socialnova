"use client"
import { useEffect, useState } from "react"
import { Loader2, ShieldAlert, Users, Search, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/toast"
import { downloadCSV, downloadJSON } from "@/lib/export"

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

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`)
  return data
}
function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export default function AdminUsersPage() {
  const { addToast } = useToast()
  const [role, setRole] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [userTotal, setUserTotal] = useState(0)
  const [userPage, setUserPage] = useState(1)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchJson("/api/auth/me")
      .then(me => {
        const r = me?.user?.role ?? me?.role ?? "user"
        setRole(r)
        setIsAdmin(r === "admin" || r === "superadmin")
        setIsSuperAdmin(r === "superadmin")
      })
      .catch(() => {
        setRole("user")
        setIsAdmin(false)
      })
  }, [])

  const loadUsers = async (page: number, query: string) => {
    try {
      const q = query ? `&search=${encodeURIComponent(query)}` : ""
      const data = await fetchJson(`/api/admin/users?page=${page}&per_page=10${q}`)
      setUsers(data.users ?? [])
      setUserTotal(data.total ?? 0)
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load users", "error")
    }
  }
  useEffect(() => {
    if (isAdmin) loadUsers(userPage, search)
  }, [isAdmin, userPage])

  const onSearch = () => {
    setUserPage(1)
    if (isAdmin) loadUsers(1, search)
  }

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
      addToast(`${u.email} role → ${data?.role ?? target}`, data?.ok ? "success" : "error")
      loadUsers(userPage, search)
    } catch (err) {
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
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 15%, transparent)" }}>
          <ShieldAlert className="h-7 w-7" style={{ color: "var(--color-error)" }} />
        </div>
        <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>Access denied</h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Admin privileges required.</p>
        <Badge variant="default">{role}</Badge>
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(userTotal / 10))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>Users</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{userTotal} total — search, enable/disable, and (superadmin) change roles</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: "var(--accent)" }} />
              <div>
                <CardTitle>All users</CardTitle>
                <CardDescription>Paginated · {userTotal} total</CardDescription>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <Input
                  className="pl-9"
                  placeholder="Search by email"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") onSearch() }}
                />
              </div>
              <Button variant="secondary" size="sm" onClick={onSearch}>Search</Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadCSV(`users-${new Date().toISOString().slice(0, 10)}.csv`, users as unknown as Record<string, unknown>[])}
                disabled={users.length === 0}
                title="Export current page as CSV"
              >
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadJSON(`users-${new Date().toISOString().slice(0, 10)}.json`, users)}
                disabled={users.length === 0}
                title="Export current page as JSON"
              >
                JSON
              </Button>
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
                  <th className="text-left font-medium py-2">Tier</th>
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
                    <td className="py-2.5"><Badge variant={u.role === "superadmin" ? "warning" : u.role === "admin" ? "info" : "default"}>{u.role}</Badge></td>
                    <td className="py-2.5"><Badge variant="default">{u.tier}</Badge></td>
                    <td className="py-2.5" style={{ color: "var(--text-secondary)" }}>{fmtDate(u.created_at)}</td>
                    <td className="py-2.5"><Badge variant={u.is_active ? "success" : "error"}>{u.is_active ? "Active" : "Disabled"}</Badge></td>
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
                        <Button variant="ghost" size="sm" onClick={() => toggleUser(u)}>{u.is_active ? "Disable" : "Enable"}</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center" style={{ color: "var(--text-muted)" }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center">
            <Pagination currentPage={userPage} totalPages={totalPages} onPageChange={p => setUserPage(p)} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
