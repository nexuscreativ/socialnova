import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "default"
  size?: "sm" | "md" | "lg" | "icon"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild, ...props }, ref) => {
    const variants = {
      primary: "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white",
      default: "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white",
      secondary: "border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]",
      ghost: "hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]",
      danger: "bg-red-500 hover:bg-red-600 text-white",
    }
    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-9 w-9",
    }
    const classes = cn(
      "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50",
      variants[variant],
      sizes[size],
      className
    )
    // asChild: render children directly with styling
    if (asChild && React.isValidElement(props.children)) {
      return React.cloneElement(props.children as React.ReactElement<{ className?: string }>, {
        className: cn(classes, (props.children as React.ReactElement<{ className?: string }>).props.className),
      })
    }
    return (
      <button
        className={classes}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
