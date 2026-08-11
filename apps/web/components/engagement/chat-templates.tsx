"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  Calendar,
  TrendingUp,
  MessageSquare,
  Rocket,
  BarChart3,
  ArrowRight,
  Lightbulb,
} from "lucide-react"

interface ChatTemplate {
  id: string
  title: string
  prompt: string
  icon: any
  category: string
  color: string
}

interface ChatTemplatesProps {
  onSelect?: (prompt: string) => void
}

const templates: ChatTemplate[] = [
  {
    id: "content-1",
    title: "Create a LinkedIn post",
    prompt: "Create a professional LinkedIn post about [your topic] that drives engagement",
    icon: MessageSquare,
    category: "Content",
    color: "var(--color-info)",
  },
  {
    id: "content-2",
    title: "Generate 5 Instagram captions",
    prompt: "Generate 5 engaging Instagram captions for my brand with relevant hashtags",
    icon: Sparkles,
    category: "Content",
    color: "var(--accent)",
  },
  {
    id: "schedule-1",
    title: "Best posting times",
    prompt: "What are the best times to post on LinkedIn and Instagram for my audience?",
    icon: Calendar,
    category: "Schedule",
    color: "var(--color-success)",
  },
  {
    id: "analytics-1",
    title: "Analyze my performance",
    prompt: "Analyze my social media performance and suggest improvements",
    icon: BarChart3,
    category: "Analytics",
    color: "var(--color-warning)",
  },
  {
    id: "gtm-1",
    title: "Plan a product launch",
    prompt: "Help me create a go-to-market strategy for my new product launch",
    icon: Rocket,
    category: "GTM",
    color: "var(--accent)",
  },
  {
    id: "growth-1",
    title: "Grow my audience",
    prompt: "Give me 10 actionable tips to grow my social media audience this month",
    icon: TrendingUp,
    category: "Growth",
    color: "var(--color-success)",
  },
]

export function ChatTemplates({ onSelect }: ChatTemplatesProps) {
  const handleSelect = (prompt: string) => {
    onSelect?.(prompt)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" style={{ color: "var(--accent)" }} />
          <CardTitle className="text-base">Quick Start</CardTitle>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Pick a template or ask anything
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((template) => (
            <Button
              key={template.id}
              variant="secondary"
              className="h-auto py-3 px-3 justify-start text-left"
              onClick={() => handleSelect(template.prompt)}
            >
              <div className="flex items-start gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `color-mix(in srgb, ${template.color} 15%, transparent)` }}
                >
                  <template.icon className="h-4 w-4" style={{ color: template.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{template.title}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                    {template.category}
                  </p>
                </div>
              </div>
            </Button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border-default)" }}>
          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            Or type your own question below 👇
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for sidebar
export function ChatTemplatesCompact({ onSelect }: ChatTemplatesProps) {
  const compactTemplates = templates.slice(0, 4)

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        Try asking:
      </p>
      {compactTemplates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect?.(template.prompt)}
          className="w-full text-left p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
        >
          <div className="flex items-center gap-2">
            <template.icon
              className="h-3 w-3 shrink-0"
              style={{ color: template.color }}
            />
            <span className="text-xs truncate group-hover:text-[var(--text-primary)]">
              {template.title}
            </span>
            <ArrowRight
              className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            />
          </div>
        </button>
      ))}
    </div>
  )
}
