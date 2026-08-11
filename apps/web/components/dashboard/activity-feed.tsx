"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Calendar, MessageSquare, TrendingUp } from "lucide-react"

const activities = [
  {
    icon: Bot,
    title: "Creator Agent generated 5 posts",
    time: "2 minutes ago",
    color: "var(--accent)",
  },
  {
    icon: Calendar,
    title: "Content scheduled for LinkedIn",
    time: "15 minutes ago",
    color: "var(--color-info)",
  },
  {
    icon: MessageSquare,
    title: "3 new leads captured",
    time: "1 hour ago",
    color: "var(--color-success)",
  },
  {
    icon: TrendingUp,
    title: "Instagram post reached 1.2k views",
    time: "3 hours ago",
    color: "var(--color-warning)",
  },
]

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${activity.color}20` }}
              >
                <activity.icon className="h-4 w-4" style={{ color: activity.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {activity.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
