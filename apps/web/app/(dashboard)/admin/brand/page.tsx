"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PRICING_TIERS } from "@/lib/pricing"

export default function AdminBrandPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}>
          Brand &amp; Site
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Single source of truth for pricing, identity, and site configuration. Marketing pages and CMS both read from <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}>lib/pricing.ts</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pricing tiers — canonical</CardTitle>
          <CardDescription>
            Displayed on the marketing site (<code>components/marketing/pricing.tsx</code>) and used as the default for new CMS pricing sections. Edit <code>lib/pricing.ts</code> to change pricing everywhere.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRICING_TIERS.map(tier => (
              <div key={tier.name} className="rounded-xl border p-4" style={{ borderColor: tier.popular ? "var(--accent)" : "var(--border-default)", background: "var(--bg-primary)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{tier.name}</span>
                  {tier.popular && <Badge variant="default" className="text-[10px]">Most popular</Badge>}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{tier.price}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{tier.period}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{tier.description}</p>
                <ul className="mt-3 space-y-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                  {tier.features.map(f => (
                    <li key={f} className="flex gap-1.5"><span style={{ color: "var(--accent)" }}>✓</span> {f}</li>
                  ))}
                </ul>
                <div className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>CTA: {tier.cta}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identity</CardTitle>
            <CardDescription>Brand tokens — see <code>brand/00-brand-identity.md</code> for the full system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-lg" style={{ background: "var(--accent)" }} />
              <span style={{ color: "var(--text-secondary)" }}>Accent <code>var(--accent)</code> — primary CTA / active</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-lg border" style={{ background: "var(--bg-primary)", borderColor: "var(--border-default)" }} />
              <span style={{ color: "var(--text-secondary)" }}>Surface <code>var(--bg-primary)</code> / <code>var(--bg-secondary)</code></span>
            </div>
            <Link href="/settings/content" className="inline-flex text-xs underline" style={{ color: "var(--accent)" }}>
              Manage CMS pages → /settings/content
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Site</CardTitle>
            <CardDescription>Navigation, footer, and announcements are driven by CMS pages.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2" style={{ color: "var(--text-secondary)" }}>
            <p>• Nav links come from published CMS pages with <code>nav_order</code> (<code>GET /site/pages/nav</code>).</p>
            <p>• Footer / announcements are CMS sections (hero, cta, etc.). Edit them in the CMS editor.</p>
            <p>• No divergent pricing copies remain — CMS pricing sections default to the canonical tiers above; editors may override per-page.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
