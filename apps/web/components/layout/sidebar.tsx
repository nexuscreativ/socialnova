"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navigation, bottomNavigation, type NavItem } from "./sidebar-nav"

export function Sidebar() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/auth/me")
      .then(r => (r.ok ? r.json() : Promise.resolve({ user: {} })))
      .then(me => {
        if (cancelled) return
        const role = me?.user?.role ?? me?.role ?? "user"
        setIsAdmin(role === "admin" || role === "superadmin")
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const visible = (items: NavItem[]) =>
    items.filter(item => !item.adminOnly || isAdmin === true)

  return (
    <aside
      className="hidden lg:flex w-64 flex-col border-r"
      style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <div className="flex items-center gap-2 p-6">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-plus-jakarta)', color: 'var(--text-primary)' }}>
          SocialNova
        </span>
      </div>

      <nav className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {visible(navigation).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t p-3" style={{ borderColor: 'var(--border-default)' }}>
        <div className="space-y-1">
          {visible(bottomNavigation).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  )
}
