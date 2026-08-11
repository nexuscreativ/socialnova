"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navigation, bottomNavigation } from "./sidebar-nav"

export function Sidebar() {
  const pathname = usePathname()

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
          {navigation.map((item) => {
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
          {bottomNavigation.map((item) => (
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
