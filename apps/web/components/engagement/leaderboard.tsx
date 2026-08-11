"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  Users,
  Calendar,
  Target,
  Star,
  ChevronDown,
  Filter,
  Flame,
} from "lucide-react"

interface TeamMember {
  id: string
  name: string
  avatar?: string
  role: string
  points: number
  postsCreated: number
  engagement: number
  streak: number
  rank: number
  change: number // rank change from last week
}

interface TeamLeaderboardProps {
  members?: TeamMember[]
  showFilters?: boolean
  compact?: boolean
}

const defaultMembers: TeamMember[] = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Content Lead",
    points: 2450,
    postsCreated: 42,
    engagement: 5.2,
    streak: 12,
    rank: 1,
    change: 0,
  },
  {
    id: "2",
    name: "Marcus Johnson",
    role: "Social Manager",
    points: 2180,
    postsCreated: 38,
    engagement: 4.8,
    streak: 8,
    rank: 2,
    change: 2,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    role: "Content Creator",
    points: 1920,
    postsCreated: 35,
    engagement: 4.5,
    streak: 10,
    rank: 3,
    change: -1,
  },
  {
    id: "4",
    name: "Alex Kim",
    role: "Marketing intern",
    points: 1650,
    postsCreated: 28,
    engagement: 3.9,
    streak: 5,
    rank: 4,
    change: 1,
  },
  {
    id: "5",
    name: "Jordan Taylor",
    role: "Brand Designer",
    points: 1420,
    postsCreated: 24,
    engagement: 4.1,
    streak: 7,
    rank: 5,
    change: -2,
  },
]

export function TeamLeaderboard({
  members = defaultMembers,
  showFilters = true,
  compact = false,
}: TeamLeaderboardProps) {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("week")
  const [metric, setMetric] = useState<"points" | "posts" | "engagement">("points")

  const sortedMembers = [...members].sort((a, b) => {
    switch (metric) {
      case "posts":
        return b.postsCreated - a.postsCreated
      case "engagement":
        return b.engagement - a.engagement
      default:
        return b.points - a.points
    }
  })

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5" style={{ color: "var(--color-warning)" }} />
      case 2:
        return <Medal className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
      case 3:
        return <Medal className="h-5 w-5" style={{ color: "#CD7F32" }} />
      default:
        return <span className="text-sm font-medium w-5 text-center">{rank}</span>
    }
  }

  const getRankChange = (change: number) => {
    if (change > 0) return <span className="text-green-500 text-xs">↑{change}</span>
    if (change < 0) return <span className="text-red-500 text-xs">↓{Math.abs(change)}</span>
    return <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {sortedMembers.slice(0, 3).map((member, i) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-2 rounded-lg"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
          >
            <div className="w-6 flex justify-center">{getRankIcon(i + 1)}</div>
            <div className="h-8 w-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-medium">
              {member.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{member.name}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {member.points.toLocaleString()} pts
              </p>
            </div>
            {getRankChange(member.change)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" style={{ color: "var(--color-warning)" }} />
            <CardTitle className="text-base">Team Leaderboard</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {members.length} members
            </span>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-1">
              {(["week", "month", "all"] as const).map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setTimeframe(tf)}
                >
                  {tf === "all" ? "All Time" : tf === "week" ? "This Week" : "This Month"}
                </Button>
              ))}
            </div>
            <div className="flex gap-1">
              {([
                { key: "points", label: "Points" },
                { key: "posts", label: "Posts" },
                { key: "engagement", label: "Engagement" },
              ] as const).map((m) => (
                <Button
                  key={m.key}
                  variant={metric === m.key ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setMetric(m.key)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Leaderboard */}
        <div className="space-y-2">
          {sortedMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                index < 3 ? "border" : ""
              }`}
              style={{
                backgroundColor:
                  index === 0
                    ? "color-mix(in srgb, var(--color-warning) 10%, transparent)"
                    : "var(--bg-secondary)",
                borderColor:
                  index === 0 ? "color-mix(in srgb, var(--color-warning) 30%, transparent)" : "var(--border-default)",
              }}
            >
              {/* Rank */}
              <div className="w-8 flex justify-center">{getRankIcon(index + 1)}</div>

              {/* Avatar */}
              <div className="h-10 w-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-medium">
                {member.name.split(" ").map((n) => n[0]).join("")}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{member.name}</p>
                  {getRankChange(member.change)}
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {member.role}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                    {metric === "points"
                      ? member.points.toLocaleString()
                      : metric === "posts"
                      ? member.postsCreated
                      : `${member.engagement}%`}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {metric === "points" ? "points" : metric === "posts" ? "posts" : "engagement"}
                  </p>
                </div>

                {metric === "points" && (
                  <div className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span className="text-xs">{member.streak}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <div
          className="mt-4 p-3 rounded-lg"
          style={{ backgroundColor: "var(--bg-tertiary)" }}
        >
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: "var(--text-muted)" }}>Total Team Points</span>
            <span className="font-bold" style={{ color: "var(--accent)" }}>
              {members.reduce((sum, m) => sum + m.points, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
