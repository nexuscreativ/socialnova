"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Key, Plus, Copy, Trash2, CheckCircle, Loader2, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  rate_limit: number
  daily_budget_cents: number
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

interface UsageSummary {
  total_requests: number
  total_tokens: number
  total_cost_cents: number
  period_start: string
  period_end: string
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "Never"
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export default function ApiKeysPage() {
  const { addToast } = useToast()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [usage, setUsage] = useState<UsageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyBudget, setNewKeyBudget] = useState("10")
  const [newKeyGenerated, setNewKeyGenerated] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [keysRes, usageRes] = await Promise.all([
        fetch("/api/users/me/api-keys", { cache: "no-store" }),
        fetch("/api/users/me/usage?days=30", { cache: "no-store" }),
      ])
      if (keysRes.ok) setKeys(await keysRes.json())
      if (usageRes.ok) setUsage(await usageRes.json())
    } catch (err) {
      console.error("load api keys error:", err)
      addToast("Failed to load API keys", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const maskKey = (key: ApiKey) => `${key.key_prefix}${"•".repeat(6)}`

  const copyKey = (text: string) => {
    navigator.clipboard.writeText(text)
    addToast("Copied to clipboard", "success")
  }

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    setSaving(true)
    try {
      const budgetCents = Math.max(0, Math.round((parseFloat(newKeyBudget) || 0) * 100))
      const res = await fetch("/api/users/me/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim(), daily_budget_cents: budgetCents }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to create API key")
      }
      setNewKeyGenerated(data.raw_key)
      setNewKeyName("")
      setNewKeyBudget("10")
      addToast("API key created", "success")
      await load()
    } catch (err) {
      console.error("create api key error:", err)
      addToast(err instanceof Error ? err.message : "Failed to create API key", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch(`/api/users/me/api-keys/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to revoke API key")
      }
      addToast("API key revoked", "info")
      await load()
    } catch (err) {
      console.error("revoke api key error:", err)
      addToast(err instanceof Error ? err.message : "Failed to revoke API key", "error")
    }
  }

  return (
    <div className="space-y-6">
      {/* New key modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setNewKeyGenerated(null) }} title="Create API Key" size="md">
        {newKeyGenerated ? (
          <div className="space-y-4">
            <div
              className="p-3 rounded-lg text-sm font-mono break-all"
              style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
            >
              {newKeyGenerated}
            </div>
            <p className="text-xs" style={{ color: "var(--color-warning)" }}>
              Copy this key now. It will not be shown again.
            </p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => copyKey(newKeyGenerated)}>
                <Copy className="h-4 w-4 mr-1.5" />
                Copy key
              </Button>
              <Button variant="secondary" onClick={() => { setShowCreate(false); setNewKeyGenerated(null) }}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="keyName" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                Key name
              </label>
              <Input
                id="keyName"
                placeholder="e.g., Production API Key"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="keyBudget" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                Daily budget (USD)
              </label>
              <Input
                id="keyBudget"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 10.00"
                value={newKeyBudget}
                onChange={e => setNewKeyBudget(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newKeyName.trim() || saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Create key
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Usage summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <div>
              <CardTitle>Usage (last 30 days)</CardTitle>
              <CardDescription>Aggregate API usage across all your keys</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Requests</p>
              <p className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                {loading ? "—" : usage?.total_requests ?? 0}
              </p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Tokens</p>
              <p className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                {loading ? "—" : (usage?.total_tokens ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Cost</p>
              <p className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                {loading ? "—" : formatMoney(usage?.total_cost_cents ?? 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API keys for external integrations</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              New key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--text-muted)" }} />
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map(key => (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border"
                  style={{ borderColor: "var(--border-default)", opacity: key.is_active ? 1 : 0.6 }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Key className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{key.name}</span>
                      <Badge variant={key.is_active ? "info" : "default"}>
                        {key.is_active ? "Active" : "Revoked"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                        {maskKey(key)}
                      </code>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Created {formatDate(key.created_at)}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Last used {formatDate(key.last_used_at)}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Budget {formatMoney(key.daily_budget_cents)}/day
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {key.is_active && (
                      <Button variant="ghost" size="sm" onClick={() => handleRevoke(key.id)} className="text-[var(--color-error)]">
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
              {keys.length === 0 && (
                <p className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
                  No API keys yet. Create one to get started.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}