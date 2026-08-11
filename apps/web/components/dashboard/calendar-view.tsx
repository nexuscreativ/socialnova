"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const posts = [
  { day: 1, count: 3 },
  { day: 2, count: 2 },
  { day: 3, count: 4 },
  { day: 4, count: 1 },
  { day: 5, count: 3 },
  { day: 6, count: 5 },
  { day: 7, count: 2 },
]

export function CalendarView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Content Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium py-2"
              style={{ color: 'var(--text-muted)' }}
            >
              {day}
            </div>
          ))}
          {posts.map((post, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs"
              style={{
                backgroundColor: post.count > 0 ? 'var(--accent)' + '20' : 'var(--bg-tertiary)',
                color: post.count > 0 ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <span className="font-medium">{i + 1}</span>
              {post.count > 0 && (
                <span className="text-[10px] mt-0.5">{post.count} posts</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
