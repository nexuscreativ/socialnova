"use client"
import { useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  History,
  Settings,
  Power,
  PowerOff,
  Bot,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  BarChart3,
  TrendingUp,
  Cpu,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/engagement/motion"

const mockAgent = {
  id: "1",
  name: "Nova",
  role: "AI Co-pilot",
  description: "Your primary AI assistant for social media management. Handles scheduling, content creation, and audience engagement.",
  status: "active" as const,
  model: "GPT-4o",
  tasksCompleted: 1247,
  successRate: 98.5,
  avgResponseTime: "1.2s",
  lastActive: "2 minutes ago",
  uptime: "99.9%",
  tokensUsed: "1.2M",
  capabilities: ["Content Creation", "Scheduling", "Analytics", "Engagement", "Campaign Management"],
  recentActivity: [
    { action: "Created Instagram carousel post", time: "2 min ago", status: "success" },
    { action: "Responded to 5 DMs on Twitter", time: "15 min ago", status: "success" },
    { action: "Scheduled LinkedIn article", time: "1 hour ago", status: "success" },
    { action: "Generated weekly analytics report", time: "2 hours ago", status: "success" },
    { action: "Attempted TikTok post upload", time: "3 hours ago", status: "error" },
  ],
}

const statusConfig = {
  active: { label: "Active", variant: "success" as const, icon: CheckCircle },
  inactive: { label: "Inactive", variant: "default" as const, icon: AlertCircle },
  error: { label: "Error", variant: "error" as const, icon: AlertCircle },
}

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { addToast } = useToast()
  const [active, setActive] = useState(mockAgent.status === "active")

  const toggleActive = () => {
    setActive(prev => !prev)
    addToast(`Agent ${active ? "deactivated" : "activated"}`, "success")
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: active ? "var(--accent)" : "var(--bg-tertiary)" }}
            >
              <Bot className="h-6 w-6" style={{ color: active ? "white" : "var(--text-muted)" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}>
                  {mockAgent.name}
                </h1>
                <Badge variant={active ? "success" : "default"}>{active ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {mockAgent.role} &middot; {mockAgent.model}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/agents/${mockAgent.id}/history`}>
            <Button variant="secondary" size="sm">
              <History className="h-4 w-4 mr-1.5" />
              History
            </Button>
          </Link>
          <Button variant="secondary" size="sm">
            <Settings className="h-4 w-4 mr-1.5" />
            Configure
          </Button>
          <Button
            variant={active ? "danger" : "primary"}
            size="sm"
            onClick={toggleActive}
          >
            {active ? (
              <><PowerOff className="h-4 w-4 mr-1.5" /> Deactivate</>
            ) : (
              <><Power className="h-4 w-4 mr-1.5" /> Activate</>
            )}
          </Button>
        </div>
      </div>

      {/* Description */}
      <FadeIn>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {mockAgent.description}
        </p>
      </FadeIn>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tasks Completed", value: mockAgent.tasksCompleted.toLocaleString(), icon: CheckCircle, color: "var(--color-success)" },
          { label: "Success Rate", value: `${mockAgent.successRate}%`, icon: TrendingUp, color: "var(--accent)" },
          { label: "Avg Response", value: mockAgent.avgResponseTime, icon: Clock, color: "var(--color-info)" },
          { label: "Uptime", value: mockAgent.uptime, icon: Activity, color: "var(--color-warning)" },
        ].map(stat => (
          <StaggerItem key={stat.label}>
            <Card>
              <CardContent className="flex items-center gap-3 py-0">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)` }}
                >
                  <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                  <p className="text-lg font-bold" style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}>
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <FadeIn delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions performed by this agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAgent.recentActivity.map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 pb-3 border-b last:border-0"
                      style={{ borderColor: "var(--border-default)" }}
                    >
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: activity.status === "success"
                            ? "color-mix(in srgb, var(--color-success) 15%, transparent)"
                            : "color-mix(in srgb, var(--color-error) 15%, transparent)",
                        }}
                      >
                        {activity.status === "success" ? (
                          <CheckCircle className="h-3 w-3" style={{ color: "var(--color-success)" }} />
                        ) : (
                          <AlertCircle className="h-3 w-3" style={{ color: "var(--color-error)" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                          {activity.action}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Capabilities */}
        <div className="space-y-4">
          <FadeIn delay={0.3}>
            <Card>
              <CardHeader>
                <CardTitle>Capabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {mockAgent.capabilities.map(cap => (
                    <span
                      key={cap}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                      style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                    >
                      <Zap className="h-3 w-3" style={{ color: "var(--accent)" }} />
                      {cap}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.4}>
            <Card>
              <CardHeader>
                <CardTitle>Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Tokens used", value: mockAgent.tokensUsed },
                  { label: "Last active", value: mockAgent.lastActive },
                  { label: "Model", value: mockAgent.model },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
                    <span style={{ color: "var(--text-primary)" }}>{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.5}>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="secondary" className="w-full justify-start" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat with {mockAgent.name}
                </Button>
                <Button variant="secondary" className="w-full justify-start" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View analytics
                </Button>
                <Button variant="secondary" className="w-full justify-start" size="sm">
                  <Cpu className="h-4 w-4 mr-2" />
                  View logs
                </Button>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  )
}
