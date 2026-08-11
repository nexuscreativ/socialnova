import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info"
}

const variantStyles = {
  default: { bg: "var(--bg-tertiary)", color: "var(--text-secondary)" },
  success: { bg: "color-mix(in srgb, var(--color-success) 15%, transparent)", color: "var(--color-success)" },
  warning: { bg: "color-mix(in srgb, var(--color-warning) 15%, transparent)", color: "var(--color-warning)" },
  error: { bg: "color-mix(in srgb, var(--color-error) 15%, transparent)", color: "var(--color-error)" },
  info: { bg: "color-mix(in srgb, var(--color-info) 15%, transparent)", color: "var(--color-info)" },
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  const style = variantStyles[variant]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      style={{ backgroundColor: style.bg, color: style.color }}
      {...props}
    />
  )
}
