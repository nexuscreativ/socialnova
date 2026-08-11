"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function Select({ options, value, onValueChange, placeholder = "Select...", className, disabled }: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const ref = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => o.value === value)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault()
        if (open && highlightedIndex >= 0) {
          const available = options.filter(o => !o.disabled)
          if (available[highlightedIndex]) {
            onValueChange?.(available[highlightedIndex].value)
            setOpen(false)
          }
        } else {
          setOpen(true)
        }
        break
      case "ArrowDown":
        e.preventDefault()
        if (!open) setOpen(true)
        else {
          setHighlightedIndex(prev => Math.min(prev + 1, options.filter(o => !o.disabled).length - 1))
        }
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex(prev => Math.max(prev - 1, 0))
        break
      case "Escape":
        setOpen(false)
        break
    }
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]",
          disabled && "cursor-not-allowed opacity-50"
        )}
        style={{
          borderColor: "var(--border-default)",
          backgroundColor: "var(--bg-secondary)",
          color: selectedOption ? "var(--text-primary)" : "var(--text-muted)",
        }}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} style={{ color: "var(--text-muted)" }} />
      </button>
      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border py-1 shadow-lg"
          style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-default)" }}
          role="listbox"
        >
          {options.map((option, i) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onClick={() => {
                onValueChange?.(option.value)
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
                option.disabled && "opacity-50 cursor-not-allowed",
                highlightedIndex === i && "bg-[var(--bg-tertiary)]"
              )}
              style={{ color: "var(--text-primary)" }}
              role="option"
              aria-selected={option.value === value}
            >
              {option.value === value && <Check className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />}
              <span className={cn("text-left", option.value !== value && "pl-6")}>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
