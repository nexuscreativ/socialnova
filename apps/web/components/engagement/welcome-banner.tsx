"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, TrendingUp, Calendar, MessageSquare, ArrowRight } from "lucide-react"

interface WelcomeBannerProps {
  userName?: string
  streak?: number
  lastActive?: string
}

export function WelcomeBanner({ userName = "there", streak = 0, lastActive }: WelcomeBannerProps) {
  const [greeting, setGreeting] = useState("")
  const [suggestion, setSuggestion] = useState({ text: "", icon: Sparkles, action: "" })

  useEffect(() => {
    // Time-based greeting
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good morning")
    else if (hour < 17) setGreeting("Good afternoon")
    else setGreeting("Good evening")

    // Smart suggestion based on time/context
    const suggestions = [
      {
        text: "Check out what your AI agents accomplished today",
        icon: Sparkles,
        action: "View Activity",
      },
      {
        text: "Your best posting time is coming up in 2 hours",
        icon: Calendar,
        action: "Schedule Now",
      },
      {
        text: "3 new leads need your attention",
        icon: MessageSquare,
        action: "View Inbox",
      },
      {
        text: "Your engagement is up 12% this week",
        icon: TrendingUp,
        action: "See Analytics",
      },
    ]
    setSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)])
  }, [])

  const getTimeSinceLastActive = () => {
    if (!lastActive) return null
    const diff = Date.now() - new Date(lastActive).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return "just now"
    if (hours < 24) return `${hours} hours ago`
    return `${Math.floor(hours / 24)} days ago`
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Gradient background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: "linear-gradient(135deg, var(--accent) 0%, transparent 50%)",
        }}
      />

      <CardContent className="relative p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {greeting}, {userName}! 👋
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {streak > 0 ? (
                <>
                  You're on a <span style={{ color: "var(--accent)" }}>{streak}-day streak</span>.
                  Keep it up!
                </>
              ) : lastActive ? (
                <>Welcome back! Last active {getTimeSinceLastActive()}</>
              ) : (
                <>Welcome to SocialNova! Let's get your social media running on autopilot.</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <suggestion.icon className="h-4 w-4" style={{ color: "var(--accent)" }} />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {suggestion.text}
              </span>
            </div>
            <Button size="sm">
              {suggestion.action}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Streak visualization */}
        {streak > 0 && (
          <div className="mt-4 flex items-center gap-2">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="h-2 flex-1 rounded-full"
                style={{
                  backgroundColor:
                    i < streak % 7 || streak >= 7
                      ? "var(--accent)"
                      : "var(--bg-tertiary)",
                }}
              />
            ))}
            <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>
              {streak}/7 days
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
