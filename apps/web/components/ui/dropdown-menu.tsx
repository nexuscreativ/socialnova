"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { MoreVertical } from "lucide-react"

interface DropdownMenuItem {
  label?: string
  icon?: React.ReactNode
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
  separator?: boolean
}

interface DropdownMenuProps {
  trigger?: React.ReactNode
  items: DropdownMenuItem[]
  align?: "left" | "right"
  className?: string
}

export function DropdownMenu({ trigger, items, align = "right", className }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger || (
          <button
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
            style={{ color: "var(--text-muted)" }}
            aria-label="More options"
            aria-haspopup="true"
            aria-expanded={open}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 min-w-[180px] rounded-lg border py-1 shadow-lg",
            align === "right" ? "right-0" : "left-0"
          )}
          style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-default)" }}
          role="menu"
        >
          {items.map((item, i) =>
            item.separator ? (
              <div key={i} className="my-1 h-px" style={{ backgroundColor: "var(--border-default)" }} role="separator" />
            ) : (
              <button
                key={i}
                onClick={() => {
                  item.onClick?.()
                  setOpen(false)
                }}
                disabled={item.disabled}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
                  item.disabled && "opacity-50 cursor-not-allowed"
                )}
                style={{
                  color: item.danger ? "var(--color-error)" : "var(--text-primary)",
                }}
                onMouseEnter={e => {
                  if (!item.disabled) e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "transparent"
                }}
                role="menuitem"
              >
                {item.icon && <span className="h-4 w-4 shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
