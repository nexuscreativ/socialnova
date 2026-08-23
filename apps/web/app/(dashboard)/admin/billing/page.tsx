"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, ShieldAlert, CreditCard, Users, DollarSign, Plug } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { PRICING_TIERS } from "@/lib/pricing"

interface BillingOverview {
  total_users: number
  by_tier: Record<string, number>
  stripe_customers: number
  stripe_configured: boolean
  stripe_webhook: boolean
  estimated_mrr_cents: number
  currency: string
}

async function fetchJson(url: string) {
  const res = await fetch(url)
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`)
  return data
}
function money(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function AdminBillingPage() {
  const { addToast } = useToast()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [data, setData] = useState<BillingOverview | null>(null)
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
      setData(await fetchJson("/api/admin/billing"))
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load billing", "error")
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
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>Billing</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Platform revenue snapshot — by tier, Stripe customers, estimated MRR (canonical <code>lib/pricing.ts</code>)
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <DollarSign className="h-4 w-4 mr-1.5" />}
          Refresh
        </Button>
      </div>

      {!data || loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4" style={{ color: "var(--accent)" }} /><span className="text-xs" style={{ color: "var(--text-muted)" }}>Total users</span></div>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>{data.total_users.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4" style={{ color: "var(--accent)" }} /><span className="text-xs" style={{ color: "var(--text-muted)" }}>Est. MRR</span></div>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>{money(data.estimated_mrr_cents)}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>pro $29 + enterprise $99</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1"><CreditCard className="h-4 w-4" style={{ color: "var(--accent)" }} /><span className="text-xs" style={{ color: "var(--text-muted)" }}>Stripe customers</span></div>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>{data.stripe_customers.toLocaleString()}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{data.stripe_customers ? `${Math.round((data.stripe_customers / Math.max(1, data.total_users)) * 100)}% of users` : "—"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1"><Plug className="h-4 w-4" style={{ color: "var(--accent)" }} /><span className="text-xs" style={{ color: "var(--text-muted)" }}>Stripe</span></div>
                <Badge variant={data.stripe_configured ? "success" : "warning"}>{data.stripe_configured ? "Configured" : "Not configured"}</Badge>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{data.stripe_configured ? (data.stripe_webhook ? "webhook ✓" : "webhook not set") : "billing disabled"}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Users by tier</CardTitle>
                <CardDescription>From <code>User.tier</code> — matches pricing in <code>lib/pricing.ts</code></CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(data.by_tier)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tier, count]) => (
                      <div key={tier} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--border-default)" }}>
                        <Badge variant={tier === "enterprise" ? "warning" : tier === "pro" ? "info" : "default"}>{tier}</Badge>
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{count.toLocaleString()}</span>
                      </div>
                    ))}
                  {Object.keys(data.by_tier).length === 0 && <p className="text-sm" style={{ color: "var(--text-muted)" }}>No users</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Canonical pricing</CardTitle>
                <CardDescription>Single source of truth — <code>lib/pricing.ts</code></CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {PRICING_TIERS.map(t => (
                    <div key={t.name} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--border-default)" }}>
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t.name}</span>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{t.price}{t.period}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href="/admin/brand" className="text-xs underline" style={{ color: "var(--accent)" }}>Brand & Site → pricing</Link>
                  <Link href="/admin/integrations" className="text-xs underline" style={{ color: "var(--accent)" }}>Stripe health → integrations</Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {!data.stripe_configured && (
            <Card>
              <CardContent className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                Stripe is not configured — set <code>STRIPE_SECRET_KEY</code> (+ <code>STRIPE_WEBHOOK_SECRET</code>) and redeploy the API to enable live billing. Revenue above is estimated from tier counts, not Stripe.
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
