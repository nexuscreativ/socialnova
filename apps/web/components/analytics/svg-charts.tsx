"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { downloadCSV } from "@/lib/export"

const followers = [12000, 13500, 14200, 16800, 18900, 21000, 24589]
const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]
const platforms = [
  { name: "Instagram", value: 42, color: "var(--accent)" },
  { name: "LinkedIn", value: 28, color: "#0A66C2" },
  { name: "X", value: 18, color: "var(--text-primary)" },
  { name: "TikTok", value: 12, color: "#FE2C55" },
]

function LineChart({ data, labels: lbs }: { data: number[]; labels: string[] }) {
  const w = 600
  const h = 160
  const pad = 24
  const max = Math.max(...data)
  const min = Math.min(...data) * 0.9
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })
  const area = [...pts, `${w - pad},${h - pad}`, `${pad},${h - pad}`].join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#g1)" />
      <polyline fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" points={pts.join(" ")} />
      {data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2)
        const y = h - pad - ((v - min) / range) * (h - pad * 2)
        return <circle key={i} cx={x} cy={y} r={3.5} fill="var(--accent)" stroke="white" strokeWidth={1.5} />
      })}
      {lbs.map((l, i) => {
        const x = pad + (i / (lbs.length - 1)) * (w - pad * 2)
        return (
          <text key={l} x={x} y={h - 4} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
            {l}
          </text>
        )
      })}
    </svg>
  )
}

function BarChart({ items }: { items: { name: string; value: number; color: string }[] }) {
  const w = 600
  const barH = 28
  const gap = 12
  const h = items.length * (barH + gap) + 20
  const max = Math.max(...items.map(i => i.value))
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
      {items.map((it, i) => {
        const y = 10 + i * (barH + gap)
        const bw = (it.value / max) * (w - 140)
        return (
          <g key={it.name}>
            <text x={10} y={y + barH / 2 + 4} fontSize={12} fill="var(--text-primary)" fontWeight={600}>
              {it.name}
            </text>
            <rect x={110} y={y} width={bw} height={barH} rx={6} fill={it.color} />
            <text x={110 + bw + 8} y={y + barH / 2 + 4} fontSize={11} fill="var(--text-secondary)">
              {it.value}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function Donut({ value, label }: { value: number; label: string }) {
  const r = 48
  const c = 2 * Math.PI * r
  const off = c * (1 - value / 100)
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={120} height={120} viewBox="0 0 120 120">
        <circle cx={60} cy={60} r={r} fill="none" stroke="var(--border-default)" strokeWidth={10} />
        <circle
          cx={60}
          cy={60}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={10}
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <text x={60} y={60} textAnchor="middle" dy={4} fontSize={20} fontWeight={700} fill="var(--text-primary)">
          {value}%
        </text>
      </svg>
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
    </div>
  )
}

export function SvgAnalytics() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Followers — 7 months</CardTitle>
              <CardDescription>SVG line · no new libs</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => downloadCSV("followers.csv", followers.map((v, i) => ({ month: labels[i], followers: v })) as unknown as Record<string, unknown>[])}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </CardHeader>
          <CardContent>
            <LineChart data={followers} labels={labels} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Engagement</CardTitle>
            <CardDescription>By platform</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Donut value={78} label="Avg engagement" />
            <div className="w-full">
              <BarChart items={platforms} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
