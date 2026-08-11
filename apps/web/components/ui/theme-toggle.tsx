"use client"
import { useTheme } from "@/components/providers/theme-provider"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle({
  className,
  iconClassName,
}: {
  className?: string
  iconClassName?: string
}) {
  const { theme, toggle } = useTheme()
  return (
    <Button variant="ghost" size="icon" onClick={toggle} className={className}>
      {theme === "dark" ? (
        <Sun
          className={`h-5 w-5 ${iconClassName ?? ""}`}
          style={iconClassName ? undefined : { color: "var(--text-secondary)" }}
        />
      ) : (
        <Moon
          className={`h-5 w-5 ${iconClassName ?? ""}`}
          style={iconClassName ? undefined : { color: "var(--text-secondary)" }}
        />
      )}
    </Button>
  )
}