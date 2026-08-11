"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Clock,
  Zap,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react"

interface ContentPrediction {
  id: string
  title: string
  platform: string
  scheduledTime: string
  predictions: {
    impressions: { value: number; confidence: number }
    engagement: { value: string; confidence: number }
    reach: { value: number; confidence: number }
  }
  factors: string[]
  score: number
  status: "scheduled" | "draft" | "published"
}

interface ContentPredictionsProps {
  predictions?: ContentPrediction[]
  showAll?: boolean
}

const defaultPredictions: ContentPrediction[] = [
  {
    id: "1",
    title: "5 AI Trends Transforming Marketing in 2026",
    platform: "LinkedIn",
    scheduledTime: "Tomorrow, 2:30 PM",
    predictions: {
      impressions: { value: 12500, confidence: 87 },
      engagement: { value: "4.8%", confidence: 82 },
      reach: { value: 8200, confidence: 79 },
    },
    factors: ["Trending topic", "Optimal time", "Educational content"],
    score: 92,
    status: "scheduled",
  },
  {
    id: "2",
    title: "Behind the Scenes: Our AI Agent Factory",
    platform: "Instagram",
    scheduledTime: "Today, 6:00 PM",
    predictions: {
      impressions: { value: 8900, confidence: 75 },
      engagement: { value: "5.2%", confidence: 78 },
      reach: { value: 6100, confidence: 72 },
    },
    factors: ["Visual content", "Behind-the-scenes", "Story format"],
    score: 85,
    status: "scheduled",
  },
  {
    id: "3",
    title: "Thread: How We Automated Our Social Media",
    platform: "Twitter",
    scheduledTime: "Today, 12:00 PM",
    predictions: {
      impressions: { value: 15200, confidence: 80 },
      engagement: { value: "3.9%", confidence: 76 },
      reach: { value: 10400, confidence: 74 },
    },
    factors: ["Thread format", "How-to content", "Early posting"],
    score: 88,
    status: "published",
  },
]

export function ContentPredictions({
  predictions = defaultPredictions,
  showAll = false,
}: ContentPredictionsProps) {
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null)
  const [view, setView] = useState<"cards" | "list">("cards")

  const displayPredictions = showAll ? predictions : predictions.slice(0, 3)

  const getScoreColor = (score: number) => {
    if (score >= 90) return "var(--color-success)"
    if (score >= 75) return "var(--accent)"
    if (score >= 60) return "var(--color-warning)"
    return "var(--color-error)"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 75) return "Good"
    if (score >= 60) return "Fair"
    return "Needs Work"
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "var(--color-success)"
    if (confidence >= 60) return "var(--accent)"
    return "var(--color-warning)"
  }

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      LinkedIn: "#0A66C2",
      Instagram: "#E4405F",
      Twitter: "#1DA1F2",
      TikTok: "#000000",
      Facebook: "#1877F2",
    }
    return colors[platform] || "var(--accent)"
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      scheduled: { bg: "var(--color-info)", text: "white" },
      draft: { bg: "var(--text-muted)", text: "white" },
      published: { bg: "var(--color-success)", text: "white" },
    }
    return styles[status] || styles.draft
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" style={{ color: "var(--accent)" }} />
            <CardTitle className="text-base">Performance Predictions</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === "cards" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setView("cards")}
            >
              Cards
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setView("list")}
            >
              List
            </Button>
          </div>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          AI-powered predictions before you publish
        </p>
      </CardHeader>

      <CardContent>
        {view === "cards" ? (
          <div className="space-y-4">
            {displayPredictions.map((prediction, index) => (
              <motion.div
                key={prediction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  selectedPrediction === prediction.id
                    ? "border-[var(--accent)] shadow-lg"
                    : "border-[var(--border-default)] hover:border-[var(--accent)]/50"
                }`}
                onClick={() =>
                  setSelectedPrediction(
                    selectedPrediction === prediction.id ? null : prediction.id
                  )
                }
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: getPlatformColor(prediction.platform) }}
                      >
                        {prediction.platform}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: getStatusBadge(prediction.status).bg }}
                      >
                        {prediction.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium truncate">{prediction.title}</h4>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      <Clock className="h-3 w-3 inline mr-1" />
                      {prediction.scheduledTime}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div
                      className="text-2xl font-bold"
                      style={{ fontFamily: "var(--font-plus-jakarta)", color: getScoreColor(prediction.score) }}
                    >
                      {prediction.score}
                    </div>
                    <p className="text-[10px]" style={{ color: getScoreColor(prediction.score) }}>
                      {getScoreLabel(prediction.score)}
                    </p>
                  </div>
                </div>

                {/* Predictions */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 rounded" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                    <Eye className="h-4 w-4 mx-auto mb-1" style={{ color: "var(--color-info)" }} />
                    <p className="text-sm font-bold">
                      {prediction.predictions.impressions.value.toLocaleString()}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      Impressions
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <div
                        className="h-1 w-8 rounded-full"
                        style={{ backgroundColor: "var(--bg-primary)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${prediction.predictions.impressions.confidence}%`,
                            backgroundColor: getConfidenceColor(prediction.predictions.impressions.confidence),
                          }}
                        />
                      </div>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {prediction.predictions.impressions.confidence}%
                      </span>
                    </div>
                  </div>

                  <div className="text-center p-2 rounded" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                    <Heart className="h-4 w-4 mx-auto mb-1" style={{ color: "var(--color-success)" }} />
                    <p className="text-sm font-bold">{prediction.predictions.engagement.value}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      Engagement
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <div
                        className="h-1 w-8 rounded-full"
                        style={{ backgroundColor: "var(--bg-primary)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${prediction.predictions.engagement.confidence}%`,
                            backgroundColor: getConfidenceColor(prediction.predictions.engagement.confidence),
                          }}
                        />
                      </div>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {prediction.predictions.engagement.confidence}%
                      </span>
                    </div>
                  </div>

                  <div className="text-center p-2 rounded" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                    <Target className="h-4 w-4 mx-auto mb-1" style={{ color: "var(--accent)" }} />
                    <p className="text-sm font-bold">
                      {prediction.predictions.reach.value.toLocaleString()}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      Reach
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <div
                        className="h-1 w-8 rounded-full"
                        style={{ backgroundColor: "var(--bg-primary)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${prediction.predictions.reach.confidence}%`,
                            backgroundColor: getConfidenceColor(prediction.predictions.reach.confidence),
                          }}
                        />
                      </div>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {prediction.predictions.reach.confidence}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Factors */}
                <div className="flex flex-wrap gap-1">
                  {prediction.factors.map((factor, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
                        color: "var(--accent)",
                      }}
                    >
                      {factor}
                    </span>
                  ))}
                </div>

                {/* Expanded details */}
                {selectedPrediction === prediction.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-3 pt-3 border-t"
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" className="flex-1">
                        <Zap className="h-3 w-3 mr-1" />
                        Optimize
                      </Button>
                      <Button size="sm" className="flex-1">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {displayPredictions.map((prediction, index) => (
              <motion.div
                key={prediction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg border"
                style={{ borderColor: "var(--border-default)" }}
              >
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: getPlatformColor(prediction.platform) }}
                >
                  <span className="text-white text-xs font-bold">
                    {prediction.platform[0]}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{prediction.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {prediction.scheduledTime}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: getScoreColor(prediction.score) }}>
                    {prediction.score}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {prediction.predictions.engagement.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!showAll && predictions.length > 3 && (
          <Button variant="ghost" className="w-full mt-4">
            View All Predictions
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
