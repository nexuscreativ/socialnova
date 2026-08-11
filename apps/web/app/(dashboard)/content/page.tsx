"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Eye,
  Edit3,
  Trash2,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  Image,
  FileText,
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

interface ContentItem {
  id: string
  title: string
  platform: string
  type: "text" | "image" | "video" | "carousel"
  status: "draft" | "scheduled" | "published" | "failed"
  scheduledFor?: string
  publishedAt?: string
  engagement?: { likes: number; comments: number; shares: number }
}

const mockContent: ContentItem[] = [
  { id: "1", title: "10 Tips for Social Media Growth in 2026", platform: "Instagram", type: "carousel", status: "published", publishedAt: "Jul 28, 2026", engagement: { likes: 1243, comments: 89, shares: 56 } },
  { id: "2", title: "Behind the scenes of our latest campaign", platform: "TikTok", type: "video", status: "scheduled", scheduledFor: "Aug 10, 2026" },
  { id: "3", title: "Meet the team: Engineering edition", platform: "LinkedIn", type: "image", status: "draft" },
  { id: "4", title: "Quick tip: Automate your content calendar", platform: "Twitter", type: "text", status: "published", publishedAt: "Jul 25, 2026", engagement: { likes: 456, comments: 23, shares: 12 } },
  { id: "5", title: "Product update: New analytics dashboard", platform: "Instagram", type: "image", status: "scheduled", scheduledFor: "Aug 12, 2026" },
  { id: "6", title: "Why AI is the future of social media", platform: "LinkedIn", type: "text", status: "published", publishedAt: "Jul 22, 2026", engagement: { likes: 892, comments: 67, shares: 34 } },
  { id: "7", title: "User spotlight: @socialpro_jane", platform: "Instagram", type: "carousel", status: "draft" },
  { id: "8", title: "Live Q&A announcement", platform: "Twitter", type: "text", status: "failed" },
]

const statusConfig = {
  draft: { label: "Draft", variant: "default" as const, icon: FileText },
  scheduled: { label: "Scheduled", variant: "info" as const, icon: Clock },
  published: { label: "Published", variant: "success" as const, icon: CheckCircle },
  failed: { label: "Failed", variant: "error" as const, icon: AlertCircle },
}

const typeIcons = {
  text: FileText,
  image: Image,
  video: () => <span className="text-sm">🎬</span>,
  carousel: () => <span className="text-sm">📑</span>,
}

export default function ContentPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [platformFilter, setPlatformFilter] = useState("")
  const [page, setPage] = useState(1)

  const filtered = mockContent.filter(item => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && item.status !== statusFilter) return false
    if (platformFilter && item.platform !== platformFilter) return false
    return true
  })

  const perPage = 6
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  if (mockContent.length === 0) {
    return <EmptyState type="content" onAction={() => router.push("/content/new")} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
          >
            Content
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {filtered.length} pieces of content
          </p>
        </div>
        <Link href="/content/new">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" />
            Create content
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
          <Input
            placeholder="Search content..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <Select
          options={[
            { value: "", label: "All statuses" },
            { value: "draft", label: "Draft" },
            { value: "scheduled", label: "Scheduled" },
            { value: "published", label: "Published" },
            { value: "failed", label: "Failed" },
          ]}
          value={statusFilter}
          onValueChange={v => { setStatusFilter(v); setPage(1) }}
          className="w-full sm:w-40"
        />
        <Select
          options={[
            { value: "", label: "All platforms" },
            { value: "Instagram", label: "Instagram" },
            { value: "Twitter", label: "Twitter" },
            { value: "LinkedIn", label: "LinkedIn" },
            { value: "TikTok", label: "TikTok" },
          ]}
          value={platformFilter}
          onValueChange={v => { setPlatformFilter(v); setPage(1) }}
          className="w-full sm:w-40"
        />
      </div>

      {/* Content Grid */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map(item => {
          const status = statusConfig[item.status]
          return (
            <StaggerItem key={item.id}>
              <Card
                className="transition-all hover:shadow-md cursor-pointer group"
                onClick={() => router.push(`/content/${item.id}`)}
              >
                <CardContent className="py-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant}>
                        <status.icon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {item.platform}
                      </span>
                    </div>
                    <DropdownMenu
                      items={[
                        { label: "Edit", icon: <Edit3 className="h-3.5 w-3.5" />, onClick: () => router.push(`/content/${item.id}`) },
                        { label: "Preview", icon: <Eye className="h-3.5 w-3.5" /> },
                        { separator: true },
                        { label: "Delete", icon: <Trash2 className="h-3.5 w-3.5" />, danger: true },
                      ]}
                    />
                  </div>
                  <h3
                    className="text-sm font-semibold mb-2 line-clamp-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                    {item.scheduledFor && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {item.scheduledFor}
                      </span>
                    )}
                    {item.publishedAt && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {item.publishedAt}
                      </span>
                    )}
                  </div>
                  {item.engagement && (
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs" style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}>
                      <span>{item.engagement.likes.toLocaleString()} likes</span>
                      <span>{item.engagement.comments} comments</span>
                      <span>{item.engagement.shares} shares</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>
          )
        })}
      </StaggerContainer>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No content found matching your filters.
          </p>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="justify-center" />
    </div>
  )
}
