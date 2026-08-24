"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, LayoutDashboard, Calendar, Megaphone, MessageSquare, BarChart3, Bot, Settings, ShieldCheck, CreditCard, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Command {
  id: string
  label: string
  description?: string
  href: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  keywords?: string
}

const COMMANDS: Command[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: "home overview" },
  { id: "content", label: "Content", description: "Create & manage posts", href: "/content", icon: Calendar },
  { id: "campaigns", label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { id: "inbox", label: "Inbox", href: "/inbox", icon: MessageSquare },
  { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
  { id: "agents", label: "Agents", href: "/agents", icon: Bot },
  { id: "chat", label: "Chat with Nova", href: "/chat", icon: Bot, keywords: "ai assistant" },
  { id: "admin", label: "Admin", href: "/admin", icon: ShieldCheck },
  { id: "admin-users", label: "Admin — Users", href: "/admin/users", icon: ShieldCheck },
  { id: "admin-billing", label: "Admin — Billing", href: "/admin/billing", icon: CreditCard },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings },
  { id: "billing", label: "Billing", href: "/settings/billing", icon: CreditCard },
  { id: "content-cms", label: "CMS Pages", href: "/settings/content", icon: FileText, keywords: "site pages" },
]

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
      if (e.key === "Escape" && open) onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const filtered = query.trim()
    ? COMMANDS.filter(c => `${c.label} ${c.description ?? ""} ${c.keywords ?? ""} ${c.href}`.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => onOpenChange(false)}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-[min(640px,calc(100vw-2rem))] rounded-xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border-default)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
          <Search className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, tools, or jump to..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)" }}
          />
          <span className="text-xs px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}>
            Esc
          </span>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
              No results
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map(cmd => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    onOpenChange(false)
                    router.push(cmd.href)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <cmd.icon className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {cmd.label}
                    </p>
                    {cmd.description && <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{cmd.description}</p>}
                  </div>
                  <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                    {cmd.href}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="px-3 py-2 border-t flex items-center gap-2 text-xs" style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}>
          <span>Press</span>
          <span className="px-1 py-0.5 rounded border text-xs" style={{ borderColor: "var(--border-default)" }}>
            ↑↓
          </span>
          <span>to navigate · ↵ to open · Esc to close</span>
        </div>
      </div>
    </div>
  )
}
