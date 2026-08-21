"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { adminNav } from "@/components/layout/sidebar-nav"
import { cn } from "@/lib/utils"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Admin sub-navigation */}
      <aside className="lg:w-56 shrink-0">
        <div className="flex items-center gap-2 mb-3 px-2">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
          >
            Admin
          </span>
        </div>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {adminNav.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors",
                  active
                    ? "font-medium"
                    : "hover:bg-[var(--bg-tertiary)]"
                )}
                style={
                  active
                    ? { backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)", color: "var(--accent)" }
                    : { color: "var(--text-secondary)" }
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
