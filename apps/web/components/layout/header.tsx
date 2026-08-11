"use client"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { UserMenu } from "@/components/layout/user-menu"
import { Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationCenter } from "@/components/engagement/notifications"

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header
      className="h-16 border-b flex items-center justify-between px-6"
      style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="search"
            placeholder="Search or press Cmd+K..."
            className="h-10 w-48 xl:w-96 rounded-lg border bg-[var(--bg-primary)] pl-10 pr-4 text-sm transition-all"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <NotificationCenter />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
