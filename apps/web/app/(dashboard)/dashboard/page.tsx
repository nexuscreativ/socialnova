"use client"
import { useState, useEffect } from "react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { CalendarView } from "@/components/dashboard/calendar-view"
import { PlatformGrid } from "@/components/dashboard/platform-grid"
import { OnboardingChecklist } from "@/components/engagement/onboarding-checklist"
import { WelcomeBanner } from "@/components/engagement/welcome-banner"
import { EngagementScore } from "@/components/engagement/engagement-score"
import { AchievementSystem } from "@/components/engagement/achievements"
import { SocialProofTicker } from "@/components/engagement/social-proof"
import { DashboardWidgets } from "@/components/engagement/dashboard-widgets"
import { AgentActivityTimeline } from "@/components/engagement/agent-timeline"
import { AnimatedCard, StaggerContainer, StaggerItem } from "@/components/engagement/motion"

export default function DashboardPage() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("onboarding-completed")
    if (!onboardingCompleted) {
      setShowOnboarding(true)
    }
    
    // Simulate streak data
    const savedStreak = localStorage.getItem("user-streak")
    setStreak(savedStreak ? parseInt(savedStreak) : 3)
  }, [])

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner userName="Alex" streak={streak} />

      {/* Onboarding Checklist - shows for new users */}
      {showOnboarding && (
        <OnboardingChecklist
          onComplete={() => {
            setShowOnboarding(false)
            localStorage.setItem("onboarding-completed", "true")
            setStreak(1)
          }}
          onDismiss={() => setShowOnboarding(false)}
        />
      )}

      {/* Social Proof Ticker */}
      <SocialProofTicker />

      {/* Stats Cards with Animation */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatsCard title="Total Followers" value="24,589" change={12.5} />
        </StaggerItem>
        <StaggerItem>
          <StatsCard title="Engagement Rate" value="4.2%" change={0.8} />
        </StaggerItem>
        <StaggerItem>
          <StatsCard title="Posts This Week" value="18" change={-2.1} />
        </StaggerItem>
        <StaggerItem>
          <StatsCard title="Leads Generated" value="142" change={23.4} />
        </StaggerItem>
      </StaggerContainer>

      {/* Engagement Score + Achievements Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedCard delay={0.1}>
          <EngagementScore />
        </AnimatedCard>
        <AnimatedCard delay={0.2}>
          <AchievementSystem />
        </AnimatedCard>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnimatedCard delay={0.3}>
            <CalendarView />
          </AnimatedCard>
        </div>
        <div>
          <AnimatedCard delay={0.4}>
            <ActivityFeed />
          </AnimatedCard>
        </div>
      </div>

      {/* Platform Grid with Animation */}
      <AnimatedCard delay={0.5}>
        <PlatformGrid />
      </AnimatedCard>

      {/* Agent Activity Timeline */}
      <AnimatedCard delay={0.6}>
        <AgentActivityTimeline limit={5} />
      </AnimatedCard>

      {/* Dashboard Widgets Customization */}
      <AnimatedCard delay={0.7}>
        <DashboardWidgets />
      </AnimatedCard>
    </div>
  )
}
