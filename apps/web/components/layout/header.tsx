"use client"
import { useState } from "react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { UserMenu } from "@/components/layout/user-menu"
import { Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationCenter } from "@/components/engagement/notifications"
import { CommandPalette } from "@/components/ui/command-palette"
import { LanguageToggle } from "@/components/i18n/language-toggle"

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  return (
    <>
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
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="relative hidden md:flex items-center h-10 w-48 xl:w-96 rounded-lg border bg-[var(--bg-primary)] pl-10 pr-4 text-sm text-left"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
            aria-label="Open command palette"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            Search or press Cmd+K…
            <span className="ml-auto hidden xl:inline-flex items-center gap-1 text-xs">
              <span className="px-1.5 py-0.5 rounded border text-xs" style={{ borderColor: 'var(--border-default)' }}>
                ⌘K
              </span>
            </span>
          </button>
        </div>
      <div className="flex items-center gap-2">
        <NotificationCenter />
        <LanguageToggle />
        <ThemeToggle />
        <UserMenu />
      </div>
      </header>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  )
}
