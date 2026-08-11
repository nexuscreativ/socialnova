"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Calendar,
  MessageSquare,
  TrendingUp,
  Users,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react"

interface EmptyStateProps {
  type: "calendar" | "activity" | "platforms" | "content" | "campaigns" | "inbox"
  onAction?: () => void
}

const emptyStateConfig = {
  calendar: {
    icon: Calendar,
    title: "No posts scheduled",
    description: "Start scheduling content to see your calendar fill up.",
    action: "Schedule Post",
    href: "/content",
    color: "var(--color-info)",
  },
  activity: {
    icon: MessageSquare,
    title: "No recent activity",
    description: "Your AI agents will appear here once they start working.",
    action: "Chat with Nova",
    href: "/chat",
    color: "var(--accent)",
  },
  platforms: {
    icon: Users,
    title: "No platforms connected",
    description: "Connect your social media accounts to get started.",
    action: "Connect Platform",
    href: "/settings",
    color: "var(--color-success)",
  },
  content: {
    icon: Sparkles,
    title: "No content yet",
    description: "Let AI create engaging content for your audience.",
    action: "Create Content",
    href: "/content",
    color: "var(--accent)",
  },
  campaigns: {
    icon: TrendingUp,
    title: "No campaigns running",
    description: "Launch your first campaign to grow your audience.",
    action: "Create Campaign",
    href: "/campaigns",
    color: "var(--color-warning)",
  },
  inbox: {
    icon: MessageSquare,
    title: "Inbox zero!",
    description: "All caught up! New messages will appear here.",
    action: null,
    href: null,
    color: "var(--color-success)",
  },
}

export function EmptyState({ type, onAction }: EmptyStateProps) {
  const config = emptyStateConfig[type]
  const Icon = config.icon

  return (
    <Card className="border-dashed">
      <CardContent className="py-12 px-6 text-center">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)` }}
        >
          <Icon className="h-8 w-8" style={{ color: config.color }} />
        </div>

        <h3
          className="text-lg font-semibold mb-2"
          style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
        >
          {config.title}
        </h3>

        <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>
          {config.description}
        </p>

        {config.action && (
          <Button onClick={onAction}>
            <Plus className="h-4 w-4 mr-2" />
            {config.action}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for inline use
export function EmptyStateInline({
  type,
  onAction,
}: {
  type: "calendar" | "activity" | "platforms" | "content" | "campaigns" | "inbox"
  onAction?: () => void
}) {
  const config = emptyStateConfig[type]
  const Icon = config.icon

  return (
    <div className="flex items-center justify-center py-8 px-4">
      <div className="text-center">
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)` }}
        >
          <Icon className="h-6 w-6" style={{ color: config.color }} />
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
          {config.title}
        </p>
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          {config.description}
        </p>
        {config.action && (
          <Button variant="secondary" size="sm" onClick={onAction}>
            {config.action}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}
