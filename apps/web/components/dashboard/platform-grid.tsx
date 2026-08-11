"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const platforms = [
  { name: "LinkedIn", followers: "8,234", growth: "+5.2%", color: "#0A66C2" },
  { name: "Instagram", followers: "12,456", growth: "+8.1%", color: "#E4405F" },
  { name: "TikTok", followers: "3,891", growth: "+15.3%", color: "#000000" },
  { name: "X (Twitter)", followers: "5,678", growth: "+2.4%", color: "#1DA1F2" },
  { name: "YouTube", followers: "2,345", growth: "+11.2%", color: "#FF0000" },
  { name: "Facebook", followers: "9,123", growth: "+1.8%", color: "#1877F2" },
]

export function PlatformGrid() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Platform Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="p-4 rounded-xl border text-center"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div
                className="h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: platform.color }}
              >
                {platform.name[0]}
              </div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                {platform.name}
              </p>
              <p className="text-lg font-bold mt-1" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
                {platform.followers}
              </p>
              <p className="text-xs text-green-500 mt-0.5">{platform.growth}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
