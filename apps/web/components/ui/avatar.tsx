import { cn } from "@/lib/utils"

interface AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeStyles = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
  xl: "h-14 w-14 text-lg",
}

export function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
  const initials = fallback || alt?.charAt(0)?.toUpperCase() || "?"

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full", sizeStyles[size], className)}
      style={{ backgroundColor: "var(--bg-tertiary)" }}
    >
      {src ? (
        <img
          src={src}
          alt={alt || ""}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
          {initials}
        </span>
      )}
    </div>
  )
}
