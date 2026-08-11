"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { fetchNav } from "@/lib/site-content"

const fallbackNav = [
  { href: "/features", label: "Features" },
  { href: "/gtm", label: "GTM Agent" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
]

const gtmLink = { href: "/gtm", label: "GTM Agent" }

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [navLinks, setNavLinks] = useState<{ href: string; label: string }[]>(fallbackNav)

  // Marketing nav is CMS-driven: published pages with a nav order.
  useEffect(() => {
    let cancelled = false
    fetchNav()
      .then((links) => {
        if (cancelled) return
        const cms = links.map((l) => ({ href: `/${l.slug}`, label: l.label }))
        setNavLinks(cms.length ? [gtmLink, ...cms] : fallbackNav)
      })
      .catch(() => {
        if (!cancelled) setNavLinks(fallbackNav)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <nav className="sticky top-0 z-50">
      <div className="relative backdrop-blur-2xl" style={{
        backgroundColor: "rgba(9, 11, 17, 0.45)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.25)",
      }}>
        {/* Top glass highlight */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.18), transparent)",
          }}
        />
        {/* Bottom hairline */}
        {!mobileOpen && (
          <div
            className="absolute inset-x-0 bottom-0 h-px"
            style={{ background: "rgba(255, 255, 255, 0.08)" }}
          />
        )}

        <div className="relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-plus-jakarta)', color: 'rgba(255, 255, 255, 0.95)' }}
            >
              SocialNova
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="p-1.5 rounded-lg border border-transparent hover:bg-white/10 transition-colors">
              <ThemeToggle iconClassName="text-white/80" />
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="sn-cta-glow">
                  Start Free
                </Button>
              </Link>
            </div>
            <button
              className="md:hidden p-1.5 rounded-lg border border-transparent hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="h-5 w-5 text-white/80" />
              ) : (
                <Menu className="h-5 w-5 text-white/80" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="relative md:hidden px-6 pb-6 pt-2 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 pt-4 flex flex-col gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="lg" className="w-full text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)}>
                <Button size="lg" className="w-full sn-cta-glow">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}