import Link from "next/link"
import {
  Bot,
  Calendar,
  BarChart3,
  MessageSquare,
  Shield,
  Zap,
  Check,
} from "lucide-react"
import type { PublicPage, PublicSection } from "@/lib/site-content"
import { Button } from "@/components/ui/button"

const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  bot: Bot,
  calendar: Calendar,
  barchart: BarChart3,
  message: MessageSquare,
  shield: Shield,
  zap: Zap,
}

function asRecord(payload: Record<string, unknown> | undefined): Record<string, unknown> {
  return payload ?? {}
}

function Icon({
  name,
  className = "h-6 w-6",
}: {
  name?: string
  className?: string
}) {
  if (!name) return null
  const IconComponent = iconMap[name.toLowerCase()] ?? Bot
  return (
    <IconComponent
      className={className}
      style={{ color: "var(--accent)" }}
    />
  )
}

function SectionHeading({
  heading,
  subheading,
}: {
  heading?: string
  subheading?: string
}) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12">
      <h2
        className="text-3xl md:text-4xl font-bold tracking-tight"
        style={{
          fontFamily: "var(--font-plus-jakarta)",
          color: "var(--text-primary)",
        }}
      >
        {heading}
      </h2>
      {subheading ? (
        <p className="mt-4 text-lg" style={{ color: "var(--text-secondary)" }}>
          {subheading}
        </p>
      ) : null}
    </div>
  )
}

function HeroSection({ payload }: { payload: Record<string, unknown> }) {
  const badge = payload.badge ? String(payload.badge) : null
  const headline = String(payload.headline ?? "Welcome")
  const sub = String(payload.subheadline ?? "")
  const stats = Array.isArray(payload.stats) ? payload.stats : []
  const primary = asRecord(payload.primary_cta as Record<string, unknown>)
  const secondary = asRecord(payload.secondary_cta as Record<string, unknown>)

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent)",
        }}
      />
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        {badge ? (
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm border mb-8"
            style={{
              borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
              color: "var(--accent)",
            }}
          >
            {badge}
          </span>
        ) : null}
        <h1
          className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.15]"
          style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
        >
          {headline}
        </h1>
        {sub ? (
          <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            {sub}
          </p>
        ) : null}
        {Array.isArray(stats) && stats.length > 0 ? (
          <div className="mt-10 flex flex-wrap justify-center gap-8">
            {stats.map((s) => {
              const stat = s as Record<string, unknown>
              return (
                <div key={String(stat.label)}>
                  <div
                    className="text-2xl font-bold leading-none"
                    style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
                  >
                    {String(stat.value ?? "")}
                    {String(stat.suffix ?? "")}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {String(stat.label)}
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          {primary.label ? (
            <Link href={String(primary.href ?? "/signup")}>
              <Button size="lg" className="text-base px-8">
                {String(primary.label)}
              </Button>
            </Link>
          ) : null}
          {secondary.label ? (
            <Link href={String(secondary.href ?? "#")}>
              <Button variant="secondary" size="lg" className="text-base px-8">
                {String(secondary.label)}
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection({ payload }: { payload: Record<string, unknown> }) {
  const items = Array.isArray(payload.items) ? payload.items : []
  return (
    <section className="py-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          heading={payload.heading ? String(payload.heading) : undefined}
          subheading={payload.subheading ? String(payload.subheading) : undefined}
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => {
            const f = item as Record<string, unknown>
            return (
              <div
                key={idx}
                className="rounded-2xl border p-6 transition-transform hover:-translate-y-1"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                  }}
                >
                  <Icon name={f.icon ? String(f.icon) : undefined} />
                </div>
                <h3
                  className="font-semibold mb-2"
                  style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
                >
                  {String(f.title)}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {String(f.description ?? "")}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function PricingSection({ payload }: { payload: Record<string, unknown> }) {
  const tiers = Array.isArray(payload.tiers) ? payload.tiers : []
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          heading={payload.heading ? String(payload.heading) : undefined}
          subheading={payload.subheading ? String(payload.subheading) : undefined}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((t, idx) => {
            const tier = t as Record<string, unknown>
            const features = Array.isArray(tier.features) ? tier.features : []
            const popular = Boolean(tier.popular)
            return (
              <div
                key={idx}
                className={`relative rounded-2xl border p-8 ${
                  popular ? "border-[var(--accent)]" : ""
                }`}
                style={{
                  backgroundColor: popular ? "var(--bg-secondary)" : "var(--bg-primary)",
                  borderColor: popular ? "var(--accent)" : "var(--border-default)",
                }}
              >
                {popular ? (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                  >
                    Most Popular
                  </span>
                ) : null}
                <h3
                  className="font-semibold"
                  style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
                >
                  {String(tier.name)}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span
                    className="text-4xl font-bold"
                    style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
                  >
                    {String(tier.price)}
                  </span>
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {String(tier.period ?? "")}
                  </span>
                </div>
                {tier.description ? (
                  <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {String(tier.description)}
                  </p>
                ) : null}
                <ul className="mt-6 space-y-3 text-sm">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2" style={{ color: "var(--text-secondary)" }}>
                      <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
                      {String(f)}
                    </li>
                  ))}
                </ul>
                <Link href={popular ? "/signup" : "/signup"} className="block mt-8">
                  <Button className="w-full" variant={popular ? "primary" : "secondary"}>
                    {String(tier.cta ?? "Get Started")}
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FAQSection({ payload }: { payload: Record<string, unknown> }) {
  const items = Array.isArray(payload.items) ? payload.items : []
  if (items.length === 0) return null
  return (
    <section className="py-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
      <div className="max-w-3xl mx-auto px-6">
        <SectionHeading heading={payload.heading ? String(payload.heading) : undefined} />
        <div className="space-y-4">
          {items.map((item, idx) => {
            const faq = item as Record<string, unknown>
            return (
              <div
                key={idx}
                className="rounded-xl border p-6"
                style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border-default)" }}
              >
                <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {String(faq.question)}
                </h3>
                <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {String(faq.answer ?? "")}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ArticleSection({ payload }: { payload: Record<string, unknown> }) {
  const body = String(payload.body ?? "")
  const lines = body.split("\n")
  return (
    <section className="py-24">
      <div className="max-w-3xl mx-auto px-6">
        {payload.heading ? (
          <h2
            className="text-3xl font-bold mb-8"
            style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
          >
            {String(payload.heading)}
          </h2>
        ) : null}
        <div
          className="space-y-4 text-base leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {lines.map((line, idx) => {
            if (!line.trim()) return null
            if (line.trim().startsWith("======") || line.trim().startsWith("-----")) {
              return null
            }
            if (line.match(/^[A-Z][A-Za-z0-9 &'()!?,:.-]{3,}$/)) {
              return (
                <h3
                  key={idx}
                  className="text-xl font-semibold pt-4"
                  style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
                >
                  {line.trim()}
                </h3>
              )
            }
            if (line.trim().startsWith("•")) {
              return (
                <p key={idx} className="flex gap-2">
                  <span style={{ color: "var(--accent)" }}>•</span>
                  <span>{line.trim().slice(1).trim()}</span>
                </p>
              )
            }
            return <p key={idx}>{line.trim()}</p>
          })}
        </div>
      </div>
    </section>
  )
}

function StatsSection({ payload }: { payload: Record<string, unknown> }) {
  const stats = Array.isArray(payload.stats) ? payload.stats : []
  if (stats.length === 0) return null
  return (
    <section className="py-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading heading={payload.heading ? String(payload.heading) : undefined} />
        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((s, idx) => {
            const stat = s as Record<string, unknown>
            return (
              <div key={idx} className="text-center">
                <div
                  className="text-4xl font-bold"
                  style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--accent)" }}
                >
                  {String(stat.value)}
                  {String(stat.suffix ?? "")}
                </div>
                <div className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {String(stat.label)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function IntegrationsSection({ payload }: { payload: Record<string, unknown> }) {
  const items = Array.isArray(payload.items) ? payload.items : []
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          heading={payload.heading ? String(payload.heading) : undefined}
          subheading={payload.subheading ? String(payload.subheading) : undefined}
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => {
            const i = item as Record<string, unknown>
            return (
              <div
                key={idx}
                className="rounded-2xl border p-6 flex items-center gap-4"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
                    color: "var(--accent)",
                  }}
                >
                  {String(i.name ?? "?").charAt(0)}
                </div>
                <div>
                  <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {String(i.name)}
                  </div>
                  {i.description ? (
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {String(i.description)}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CTASection({ payload }: { payload: Record<string, unknown> }) {
  const primary = asRecord(payload.primary_cta as Record<string, unknown>)
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2
          className="text-3xl md:text-4xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
        >
          {String(payload.heading ?? "")}
        </h2>
        {payload.subheading ? (
          <p className="mt-4 text-lg" style={{ color: "var(--text-secondary)" }}>
            {String(payload.subheading)}
          </p>
        ) : null}
        {primary.label ? (
          <Link
            href={String(primary.href ?? "/signup")}
            className="inline-block mt-8"
          >
            <Button size="lg" className="text-base px-8">
              {String(primary.label)}
            </Button>
          </Link>
        ) : null}
      </div>
    </section>
  )
}

export function CmsPage({ page }: { page: PublicPage }) {
  return (
    <>
      {page.payload.title && page.sections.length === 0 ? (
        <HeroSection
          payload={{ badge: "SocialNova", headline: page.payload.title, subheadline: page.description }}
        />
      ) : null}
      {page.sections.map((section: PublicSection) => (
        <CmsSection key={section.section_key} section={section} />
      ))}
    </>
  )
}

export function CmsSection({ section }: { section: PublicSection }) {
  const payload = section.payload ?? {}
  switch (section.section_key) {
    case "hero":
      return <HeroSection payload={payload} />
    case "features":
      return <FeaturesSection payload={payload} />
    case "pricing":
      return <PricingSection payload={payload} />
    case "faq":
      return <FAQSection payload={payload} />
    case "article":
      return <ArticleSection payload={payload} />
    case "stats":
      return <StatsSection payload={payload} />
    case "integrations":
      return <IntegrationsSection payload={payload} />
    case "cta":
    case "final-cta":
      return <CTASection payload={payload} />
    default:
      return (
        <section className="py-24">
          <div className="max-w-3xl mx-auto px-6">
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
            >
              {String(section.section_key)}
            </h2>
            <pre className="mt-4 text-sm overflow-auto rounded-lg p-4" style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-secondary)" }}>
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </section>
      )
  }
}