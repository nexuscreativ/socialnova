import Link from "next/link"
import { fetchNav } from "@/lib/site-content"

export async function SiteFooter() {
  let cmsLinks: { slug: string; label: string }[] = []
  try {
    cmsLinks = await fetchNav()
  } catch {
    cmsLinks = []
  }

  const productLinks = [
    ...cmsLinks.filter((l) => ["features", "pricing", "about"].includes(l.slug)).map((l) => ({
      href: `/${l.slug}`,
      label: l.label,
    })),
    { href: "/agents", label: "AI Agents" },
    ...cmsLinks.filter((l) => l.slug === "integrations").map((l) => ({
      href: `/${l.slug}`,
      label: l.label,
    })),
  ]

  return (
    <footer
      className="border-t py-12"
      style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-secondary)" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              Product
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:opacity-80">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              Resources
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              {cmsLinks.filter((l) => l.slug === "blog").map((l) => (
                <li key={l.slug}>
                  <Link href={`/${l.slug}`} className="hover:opacity-80">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li><Link href="/guides" className="hover:opacity-80">Guides</Link></li>
              <li><Link href="/help" className="hover:opacity-80">Help Center</Link></li>
              <li><Link href="/docs" className="hover:opacity-80">API Docs</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              Company
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              {cmsLinks.filter((l) => l.slug === "about").map((l) => (
                <li key={l.slug}>
                  <Link href={`/${l.slug}`} className="hover:opacity-80">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li><Link href="/careers" className="hover:opacity-80">Careers</Link></li>
              {cmsLinks.filter((l) => l.slug === "contact").map((l) => (
                <li key={l.slug}>
                  <Link href={`/${l.slug}`} className="hover:opacity-80">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              Legal
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <li><Link href="/privacy" className="hover:opacity-80">Privacy</Link></li>
              <li><Link href="/terms" className="hover:opacity-80">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div
          className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded flex items-center justify-center"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              © 2026 SocialNova. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm" style={{ color: "var(--text-muted)" }}>
            <Link href="https://twitter.com/socialnova" className="hover:opacity-80">Twitter</Link>
            <Link href="https://linkedin.com/company/socialnova" className="hover:opacity-80">LinkedIn</Link>
            <Link href="https://instagram.com/socialnova" className="hover:opacity-80">Instagram</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}