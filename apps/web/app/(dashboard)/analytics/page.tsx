"use client"
import { WeeklyDigest } from "@/components/engagement/weekly-digest"
import { TeamLeaderboard } from "@/components/engagement/leaderboard"
import { ContentPredictions } from "@/components/engagement/predictions"
import { AnimatedCard, StaggerContainer, StaggerItem } from "@/components/engagement/motion"
import { SvgAnalytics } from "@/components/analytics/svg-charts"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
          Analytics & Insights
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Deep dive into your performance with AI-powered predictions and team insights.
        </p>
      </div>

      <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StaggerItem>
          <ContentPredictions />
        </StaggerItem>
        <StaggerItem>
          <TeamLeaderboard />
        </StaggerItem>
      </StaggerContainer>

      <StaggerContainer>
        <StaggerItem>
          <WeeklyDigest />
        </StaggerItem>
      </StaggerContainer>

      <SvgAnalytics />
    </div>
  )
}
