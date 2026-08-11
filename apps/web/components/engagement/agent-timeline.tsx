"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Bot,
  MessageSquare,
  Calendar,
  TrendingUp,
  Users,
  Shield,
  Rocket,
  BarChart3,
  Target,
  Zap,
  Clock,
  Filter,
  ChevronDown,
  ExternalLink,
} from "lucide-react"

interface AgentActivity {
  id: string
  agent: string
  agentIcon: any
  agentColor: string
  action: string
  details: string
  timestamp: Date
  status: "completed" | "in-progress" | "queued"
  metrics?: {
    label: string
    value: string
  }
}

interface AgentActivityTimelineProps {
  activities?: AgentActivity[]
  showFilters?: boolean
  limit?: number
}

const defaultActivities: AgentActivity[] = [
  {
    id: "1",
    agent: "Creator",
    agentIcon: MessageSquare,
    agentColor: "var(--color-success)",
    action: "Generated 5 LinkedIn posts",
    details: "Created engaging content about AI trends for your audience",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    status: "completed",
    metrics: { label: "Engagement predicted", value: "4.2%" },
  },
  {
    id: "2",
    agent: "Timing",
    agentIcon: Calendar,
    agentColor: "var(--color-info)",
    action: "Optimized posting schedule",
    details: "Analyzed audience patterns and updated your content calendar",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    status: "completed",
    metrics: { label: "Best time found", value: "2:30 PM EST" },
  },
  {
    id: "3",
    agent: "Guardian",
    agentIcon: Shield,
    agentColor: "var(--accent)",
    action: "Reviewed 3 posts for brand consistency",
    details: "All posts passed quality checks with 98% brand alignment",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    status: "completed",
    metrics: { label: "Brand score", value: "98%" },
  },
  {
    id: "4",
    agent: "Growth",
    agentIcon: TrendingUp,
    agentColor: "var(--color-warning)",
    action: "Optimized ad campaign",
    details: "Reduced CPC by 15% while maintaining reach",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    status: "completed",
    metrics: { label: "CPC reduction", value: "-15%" },
  },
  {
    id: "5",
    agent: "Connector",
    agentIcon: Users,
    agentColor: "var(--color-info)",
    action: "Scored 12 new leads",
    details: "Identified 3 high-priority leads for immediate follow-up",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: "completed",
    metrics: { label: "High-priority leads", value: "3" },
  },
  {
    id: "6",
    agent: "GTM",
    agentIcon: Rocket,
    agentColor: "var(--accent)",
    action: "Planning product launch",
    details: "Creating go-to-market strategy for Agent Factory feature",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    status: "in-progress",
  },
  {
    id: "7",
    agent: "MarketResearch",
    agentIcon: BarChart3,
    agentColor: "var(--color-warning)",
    action: "Analyzing competitor activity",
    details: "Tracked 5 competitors' posting patterns and engagement",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    status: "completed",
    metrics: { label: "Competitors tracked", value: "5" },
  },
  {
    id: "8",
    agent: "Orchestrator",
    agentIcon: Bot,
    agentColor: "var(--accent)",
    action: "Coordinated multi-agent task",
    details: "Synchronized Creator, Timing, and Guardian for content pipeline",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    status: "completed",
  },
]

export function AgentActivityTimeline({
  activities: initialActivities = defaultActivities,
  showFilters = true,
  limit,
}: AgentActivityTimelineProps) {
  const [activities, setActivities] = useState(initialActivities)
  const [filter, setFilter] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const agents = [...new Set(activities.map((a) => a.agent))]

  const filteredActivities =
    filter === "all"
      ? activities
      : activities.filter((a) => a.agent === filter)

  const displayActivities = limit ? filteredActivities.slice(0, limit) : filteredActivities

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const statusColors = {
    completed: "var(--color-success)",
    "in-progress": "var(--accent)",
    queued: "var(--text-muted)",
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" style={{ color: "var(--accent)" }} />
            <CardTitle className="text-base">Agent Activity</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        {showFilters && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            {agents.map((agent) => (
              <Button
                key={agent}
                variant={filter === agent ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={() => setFilter(agent)}
              >
                {agent}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-5 top-0 bottom-0 w-0.5"
            style={{ backgroundColor: "var(--border-default)" }}
          />

          {/* Timeline items */}
          <div className="space-y-4">
            <AnimatePresence>
              {displayActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative pl-12"
                >
                  {/* Agent icon */}
                  <div
                    className="absolute left-0 w-10 h-10 rounded-full flex items-center justify-center z-10"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${activity.agentColor} 20%, transparent)`,
                    }}
                  >
                    <activity.agentIcon
                      className="h-5 w-5"
                      style={{ color: activity.agentColor }}
                    />
                  </div>

                  {/* Activity card */}
                  <div
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      expandedId === activity.id
                        ? "border-[var(--accent)]"
                        : "border-[var(--border-default)] hover:border-[var(--accent)]/50"
                    }`}
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                    onClick={() =>
                      setExpandedId(expandedId === activity.id ? null : activity.id)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${activity.agentColor} 20%, transparent)`,
                              color: activity.agentColor,
                            }}
                          >
                            {activity.agent}
                          </span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${statusColors[activity.status]} 20%, transparent)`,
                              color: statusColors[activity.status],
                            }}
                          >
                            {activity.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium mt-1">{activity.action}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {formatTime(activity.timestamp)}
                        </p>
                      </div>

                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          expandedId === activity.id ? "rotate-180" : ""
                        }`}
                        style={{ color: "var(--text-muted)" }}
                      />
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {expandedId === activity.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 mt-3 border-t" style={{ borderColor: "var(--border-default)" }}>
                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                              {activity.details}
                            </p>
                            {activity.metrics && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                  {activity.metrics.label}:
                                </span>
                                <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                                  {activity.metrics.value}
                                </span>
                              </div>
                            )}
                            <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs">
                              View Details
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {limit && filteredActivities.length > limit && (
          <Button variant="ghost" className="w-full mt-4">
            View All Activity
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
