"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  User,
  Settings,
  CreditCard,
  KeyRound,
  LogOut,
  LayoutList,
  ChevronDown,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

interface CurrentUser {
  id: string
  email: string
  name?: string | null
  avatar_url?: string | null
  tier: string
  role: string
}

export function UserMenu() {
  const router = useRouter()
  const { addToast } = useToast()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    fetch("/api/auth/me", { cache: "no-store" })
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        if (active) {
          setUser(data.user ?? null)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setUser(null)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClickOutside)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClickOutside)
    }
  }, [open])

  const handleLogout = async () => {
    setOpen(false)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Still redirect below even if the network call hiccups
    }
    addToast("Signed out", "success")
    router.push("/login")
    router.refresh()
  }

  const isAdmin = user?.role === "admin" || user?.role === "superadmin"
  const initials = (user?.name || user?.email || "S")
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  type MenuItem = {
    label: string
    href: string | null
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
    separator?: boolean
    danger?: boolean
  }

  const items: MenuItem[] = [
    { label: "Profile", href: "/settings/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Billing", href: "/settings/billing", icon: CreditCard },
    { label: "API Keys", href: "/settings/api-keys", icon: KeyRound },
    ...(isAdmin
      ? [{ label: "Admin", href: "/admin", icon: LayoutList, separator: true }]
      : []),
    { label: "Log out", href: null, icon: LogOut, separator: isAdmin, danger: true },
  ]

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => !loading && setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 rounded-full p-0.5 transition-colors hover:bg-[var(--bg-tertiary)]",
          loading && "opacity-70 cursor-default"
        )}
        aria-label="Account menu"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {user?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt={user.name || user.email || "User"}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {loading ? "…" : initials}
          </div>
        )}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform hidden sm:block", open && "rotate-180")}
          style={{ color: "var(--text-muted)" }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 min-w-[220px] rounded-lg border py-1 shadow-lg"
          style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-default)" }}
          role="menu"
        >
          {user && (
            <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
              <div
                className="text-sm font-semibold truncate"
                style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
              >
                {user.name || user.email}
              </div>
              {user.name && (
                <div className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {user.email}
                </div>
              )}
              <div
                className="inline-flex items-center gap-1 mt-2 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  color: "var(--accent)",
                  backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
                }}
              >
                {user.role}
                {" · "}
                {user.tier}
              </div>
            </div>
          )}

          {items.map((item, i) =>
            item.separator ? (
              <div
                key={i}
                className="my-1 h-px"
                style={{ backgroundColor: "var(--border-default)" }}
                role="separator"
              />
            ) : (
              <span key={i}>
                {item.href ? (
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors"
                    style={{ color: "var(--text-primary)" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "transparent"
                    }}
                    role="menuitem"
                  >
                    <item.icon className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                    {item.label}
                  </Link>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors"
                    style={{ color: item.danger ? "var(--color-error)" : "var(--text-primary)" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "transparent"
                    }}
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4 shrink-0" style={{ color: "var(--color-error)" }} />
                    {item.label}
                  </button>
                )}
              </span>
            )
          )}
        </div>
      )}
    </div>
  )
}