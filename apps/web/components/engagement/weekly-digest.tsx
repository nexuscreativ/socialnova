"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Mail,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Calendar,
  Target,
  Zap,
  Eye,
  Send,
  Settings,
  CheckCircle,
} from "lucide-react"

interface WeeklyDigestProps {
  weekStart?: Date
  weekEnd?: Date
  onSendDigest?: () => void
  onPreview?: () => void
}

interface DigestMetric {
  label: string
  value: string
  change: number
  icon: any
  color: string
}

export function WeeklyDigest({
  weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  weekEnd = new Date(),
  onSendDigest,
  onPreview,
}: WeeklyDigestProps) {
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  const metrics: DigestMetric[] = [
    {
      label: "Total Impressions",
      value: "45,230",
      change: 12.5,
      icon: Eye,
      color: "var(--color-info)",
    },
    {
      label: "Engagement Rate",
      value: "4.8%",
      change: 0.6,
      icon: TrendingUp,
      color: "var(--color-success)",
    },
    {
      label: "New Followers",
      value: "342",
      change: 18.2,
      icon: Users,
      color: "var(--accent)",
    },
    {
      label: "Posts Published",
      value: "24",
      change: 8,
      icon: MessageSquare,
      color: "var(--color-info)",
    },
    {
      label: "Leads Generated",
      value: "28",
      change: 15,
      icon: Target,
      color: "var(--color-success)",
    },
    {
      label: "AI Credits Used",
      value: "156",
      change: -5,
      icon: Zap,
      color: "var(--color-warning)",
    },
  ]

  const topPosts = [
    { platform: "LinkedIn", engagement: "5.2%", content: "AI trends in marketing..." },
    { platform: "Instagram", engagement: "4.8%", content: "Behind the scenes..." },
    { platform: "Twitter", engagement: "3.9%", content: "Thread on social media..." },
  ]

  const handleSend = async () => {
    setIsSending(true)
    // Simulate sending
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsSending(false)
    setSent(true)
    onSendDigest?.()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" style={{ color: "var(--accent)" }} />
            <CardTitle className="text-base">Weekly Digest</CardTitle>
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {formatDate(weekStart)} - {formatDate(weekEnd)}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="p-3 rounded-lg"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <metric.icon className="h-4 w-4" style={{ color: metric.color }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {metric.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                  {metric.value}
                </span>
                <span
                  className={`text-xs ${metric.change >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {metric.change >= 0 ? "+" : ""}{metric.change}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Top Performing Posts */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">Top Performing Posts</h4>
          <div className="space-y-2">
            {topPosts.map((post, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg"
                style={{ backgroundColor: "var(--bg-tertiary)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{post.platform}</span>
                  <span className="text-xs truncate max-w-[200px]" style={{ color: "var(--text-muted)" }}>
                    {post.content}
                  </span>
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--color-success)" }}>
                  {post.engagement}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div
          className="p-4 rounded-lg mb-6"
          style={{ backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <span className="text-sm font-medium">AI Insights</span>
          </div>
          <ul className="space-y-1">
            <li className="text-xs" style={{ color: "var(--text-secondary)" }}>
              • LinkedIn posts perform 23% better when posted on Tuesdays
            </li>
            <li className="text-xs" style={{ color: "var(--text-secondary)" }}>
              • Your audience engages most with educational content
            </li>
            <li className="text-xs" style={{ color: "var(--text-secondary)" }}>
              • Consider increasing Instagram Reels for 40% more reach
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview Email
          </Button>
          <Button
            className="flex-1"
            onClick={handleSend}
            disabled={isSending || sent}
          >
            {isSending ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Sending...
              </>
            ) : sent ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Sent!
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Digest
              </>
            )}
          </Button>
        </div>

        {/* Settings */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border-default)" }}>
          <Button variant="ghost" size="sm" className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Configure Digest Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
