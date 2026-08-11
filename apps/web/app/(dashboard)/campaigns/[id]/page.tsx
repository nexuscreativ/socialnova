"use client"
import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Play,
  Pause,
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  Target,
  TrendingUp,
  Edit3,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/engagement/motion"

const mockCampaign = {
  id: "1",
  name: "Summer Product Launch",
  description: "A multi-platform campaign to launch our new product line targeting millennials and Gen Z audiences.",
  status: "active" as const,
  platforms: ["Instagram", "TikTok"],
  objective: "conversions",
  startDate: "Jul 1, 2026",
  endDate: "Aug 31, 2026",
  budget: "$5,000",
  spent: "$2,850",
  reach: 45200,
  impressions: 128500,
  clicks: 3420,
  conversions: 312,
  roi: 340,
  cpc: "$0.83",
  cpm: "$22.18",
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { addToast } = useToast()
  const [status, setStatus] = useState<"active" | "paused">(mockCampaign.status)

  const toggleStatus = () => {
    setStatus(prev => prev === "active" ? "paused" : "active")
    addToast(`Campaign ${status === "active" ? "paused" : "resumed"}`, "success")
  }

  const handleDelete = () => {
    addToast("Campaign deleted", "info")
    router.push("/campaigns")
  }

  const statusConfig = {
    active: { label: "Active", variant: "success" as const },
    paused: { label: "Paused", variant: "warning" as const },
    completed: { label: "Completed", variant: "info" as const },
    draft: { label: "Draft", variant: "default" as const },
  }

  const currentStatus = statusConfig[status]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}>
                {mockCampaign.name}
              </h1>
              <Badge variant={currentStatus.variant}>{currentStatus.label}</Badge>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {mockCampaign.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={toggleStatus}>
            {status === "active" ? (
              <><Pause className="h-4 w-4 mr-1.5" /> Pause</>
            ) : (
              <><Play className="h-4 w-4 mr-1.5" /> Resume</>
            )}
          </Button>
          <Button variant="secondary" size="sm">
            <Edit3 className="h-4 w-4 mr-1.5" /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Reach", value: mockCampaign.reach.toLocaleString(), icon: Users, color: "var(--color-info)" },
          { label: "Impressions", value: mockCampaign.impressions.toLocaleString(), icon: Target, color: "var(--accent)" },
          { label: "Clicks", value: mockCampaign.clicks.toLocaleString(), icon: TrendingUp, color: "var(--color-success)" },
          { label: "Conversions", value: mockCampaign.conversions.toString(), icon: BarChart3, color: "var(--color-warning)" },
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
        {/* Performance Chart Placeholder */}
        <div className="lg:col-span-2">
          <FadeIn delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
                <CardDescription>Campaign metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 rounded-lg flex items-center justify-center border border-dashed" style={{ borderColor: "var(--border-default)" }}>
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chart visualization</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Performance data will appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Campaign Info */}
        <div className="space-y-4">
          <FadeIn delay={0.3}>
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Objective", value: "Conversions" },
                  { label: "Platforms", value: mockCampaign.platforms.join(", ") },
                  { label: "Duration", value: `${mockCampaign.startDate} - ${mockCampaign.endDate}` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
                    <span className="text-right" style={{ color: "var(--text-primary)" }}>{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.4}>
            <Card>
              <CardHeader>
                <CardTitle>Budget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Total budget", value: mockCampaign.budget },
                  { label: "Spent", value: mockCampaign.spent },
                  { label: "ROI", value: `${mockCampaign.roi}%` },
                  { label: "CPC", value: mockCampaign.cpc },
                  { label: "CPM", value: mockCampaign.cpm },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>{item.value}</span>
                  </div>
                ))}
                {/* Budget progress bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "var(--text-muted)" }}>Budget used</span>
                    <span style={{ color: "var(--text-primary)" }}>57%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                    <div className="h-full rounded-full" style={{ backgroundColor: "var(--accent)", width: "57%" }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  )
}
