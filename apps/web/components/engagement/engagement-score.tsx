"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Zap, Target, BarChart3, ArrowRight } from "lucide-react"

interface EngagementScoreProps {
  score?: number
  trend?: "up" | "down" | "stable"
  breakdown?: {
    content: number
    engagement: number
    growth: number
    consistency: number
  }
}

export function EngagementScore({
  score: initialScore = 0,
  trend = "up",
  breakdown,
}: EngagementScoreProps) {
  const [score, setScore] = useState(initialScore)
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    // Animate score counting up
    if (initialScore === 0) {
      const targetScore = 78 // Default demo score
      const duration = 2000
      const steps = 60
      const increment = targetScore / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= targetScore) {
          setScore(targetScore)
          setIsAnimating(false)
          clearInterval(timer)
        } else {
          setScore(Math.floor(current))
        }
      }, duration / steps)

      return () => clearInterval(timer)
    } else {
      setScore(initialScore)
      setIsAnimating(false)
    }
  }, [initialScore])

  const getScoreColor = (score: number) => {
    if (score >= 80) return "var(--color-success)"
    if (score >= 60) return "var(--accent)"
    if (score >= 40) return "var(--color-warning)"
    return "var(--color-error)"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Needs Work"
  }

  const defaultBreakdown = breakdown || {
    content: 85,
    engagement: 72,
    growth: 68,
    consistency: 90,
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Gradient background based on score */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `linear-gradient(135deg, ${getScoreColor(score)} 0%, transparent 50%)`,
        }}
      />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Engagement Score</CardTitle>
          <div className="flex items-center gap-1">
            {trend === "up" ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : trend === "down" ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <BarChart3 className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
            )}
            <span
              className="text-xs"
              style={{
                color:
                  trend === "up"
                    ? "var(--color-success)"
                    : trend === "down"
                    ? "var(--color-error)"
                    : "var(--text-muted)",
              }}
            >
              {trend === "up" ? "+5%" : trend === "down" ? "-3%" : "0%"} this week
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Main Score */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="var(--bg-tertiary)"
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="40"
                stroke={getScoreColor(score)}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 251" }}
                animate={{ strokeDasharray: `${(score / 100) * 251} 251` }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-plus-jakarta)", color: getScoreColor(score) }}
              >
                {score}
              </motion.span>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-lg font-semibold" style={{ color: getScoreColor(score) }}>
              {getScoreLabel(score)}
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Your social media health score
            </p>
            <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto">
              Improve Score <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          {Object.entries(defaultBreakdown).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs capitalize" style={{ color: "var(--text-secondary)" }}>
                  {key}
                </span>
                <span className="text-xs font-medium">{value}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: getScoreColor(value) }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div
          className="mt-4 p-3 rounded-lg flex items-start gap-2"
          style={{ backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)" }}
        >
          <Zap className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            <strong>Tip:</strong> Post consistently for 7 days to boost your consistency score by 15%.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
