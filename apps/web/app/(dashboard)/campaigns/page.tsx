"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Plus,
  Search,
  TrendingUp,
  Users,
  Calendar,
  Target,
  MoreVertical,
  Play,
  Pause,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/engagement/empty-state"
import { StaggerContainer, StaggerItem } from "@/components/engagement/motion"

interface Campaign {
  id: string
  name: string
  status: "active" | "paused" | "completed" | "draft"
  platforms: string[]
  startDate: string
  endDate?: string
  budget?: string
  reach: number
  conversions: number
  roi: number
}

const mockCampaigns: Campaign[] = [
  { id: "1", name: "Summer Product Launch", status: "active", platforms: ["Instagram", "TikTok"], startDate: "Jul 1, 2026", endDate: "Aug 31, 2026", budget: "$5,000", reach: 45200, conversions: 312, roi: 340 },
  { id: "2", name: "Brand Awareness Q3", status: "active", platforms: ["LinkedIn", "Twitter"], startDate: "Jul 15, 2026", budget: "$2,500", reach: 28400, conversions: 89, roi: 180 },
  { id: "3", name: "Holiday Giveaway", status: "draft", platforms: ["Instagram"], startDate: "Dec 1, 2026", reach: 0, conversions: 0, roi: 0 },
  { id: "4", name: "Spring Sale 2026", status: "completed", platforms: ["Instagram", "Facebook", "Twitter"], startDate: "Mar 1, 2026", endDate: "Mar 31, 2026", budget: "$3,000", reach: 67800, conversions: 456, roi: 520 },
  { id: "5", name: "Influencer Collab Series", status: "paused", platforms: ["TikTok", "Instagram"], startDate: "Jun 1, 2026", budget: "$8,000", reach: 12000, conversions: 23, roi: 45 },
]

const statusConfig = {
  active: { label: "Active", variant: "success" as const },
  paused: { label: "Paused", variant: "warning" as const },
  completed: { label: "Completed", variant: "info" as const },
  draft: { label: "Draft", variant: "default" as const },
}

export default function CampaignsPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)

  const filtered = mockCampaigns.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && c.status !== statusFilter) return false
    return true
  })

  const perPage = 5
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  if (mockCampaigns.length === 0) {
    return <EmptyState type="campaigns" onAction={() => router.push("/campaigns/new")} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}>
            Campaigns
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {mockCampaigns.length} campaigns
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" />
            New campaign
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StaggerItem>
          <Card>
            <CardContent className="flex items-center gap-4 py-0">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--color-success) 15%, transparent)" }}>
                <TrendingUp className="h-5 w-5" style={{ color: "var(--color-success)" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total Reach</p>
                <p className="text-lg font-bold" style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}>
                  {mockCampaigns.reduce((s, c) => s + c.reach, 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <CardContent className="flex items-center gap-4 py-0">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--color-info) 15%, transparent)" }}>
                <Users className="h-5 w-5" style={{ color: "var(--color-info)" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total Conversions</p>
                <p className="text-lg font-bold" style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}>
                  {mockCampaigns.reduce((s, c) => s + c.conversions, 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <CardContent className="flex items-center gap-4 py-0">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
                <Target className="h-5 w-5" style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Avg. ROI</p>
                <p className="text-lg font-bold" style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--accent)" }}>
                  {Math.round(mockCampaigns.filter(c => c.roi).reduce((s, c) => s + c.roi, 0) / mockCampaigns.filter(c => c.roi).length)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <Select
          options={[
            { value: "", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "paused", label: "Paused" },
            { value: "completed", label: "Completed" },
            { value: "draft", label: "Draft" },
          ]}
          value={statusFilter}
          onValueChange={v => { setStatusFilter(v); setPage(1) }}
          className="w-full sm:w-40"
        />
      </div>

      {/* Campaign List */}
      <div className="space-y-3">
        {paginated.map(campaign => {
          const status = statusConfig[campaign.status]
          return (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className="transition-all hover:shadow-md cursor-pointer"
                onClick={() => router.push(`/campaigns/${campaign.id}`)}
              >
                <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 py-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {campaign.name}
                      </h3>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {campaign.startDate}{campaign.endDate ? ` - ${campaign.endDate}` : ""}
                      </span>
                      {campaign.budget && <span>{campaign.budget}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {campaign.platforms.map(p => (
                        <span
                          key={p}
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                          style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  {campaign.reach > 0 && (
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-center">
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Reach</p>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {campaign.reach.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Conversions</p>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {campaign.conversions}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>ROI</p>
                        <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                          {campaign.roi}%
                        </p>
                      </div>
                    </div>
                  )}
                  <DropdownMenu
                    items={[
                      { label: campaign.status === "active" ? "Pause" : "Resume", icon: campaign.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" /> },
                      { label: "Analytics", icon: <BarChart3 className="h-3.5 w-3.5" /> },
                    ]}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No campaigns found.</p>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="justify-center" />
    </div>
  )
}
