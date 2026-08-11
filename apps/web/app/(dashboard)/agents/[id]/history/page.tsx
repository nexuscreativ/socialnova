"use client"
import { useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Bot,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"

interface HistoryEntry {
  id: string
  timestamp: string
  action: string
  details: string
  status: "success" | "error" | "running"
  duration: string
  tokens: number
}

const mockHistory: HistoryEntry[] = [
  { id: "1", timestamp: "Aug 8, 2026 10:32 AM", action: "Create Instagram Post", details: "Generated carousel post about summer trends", status: "success", duration: "3.2s", tokens: 1240 },
  { id: "2", timestamp: "Aug 8, 2026 10:15 AM", action: "Respond to DM", details: "Auto-replied to customer inquiry on Twitter", status: "success", duration: "1.1s", tokens: 450 },
  { id: "3", timestamp: "Aug 8, 2026 9:45 AM", action: "Schedule Post", details: "Scheduled LinkedIn article for tomorrow 9AM", status: "success", duration: "0.8s", tokens: 320 },
  { id: "4", timestamp: "Aug 8, 2026 9:20 AM", action: "Generate Report", details: "Weekly analytics report for all platforms", status: "success", duration: "8.5s", tokens: 3200 },
  { id: "5", timestamp: "Aug 8, 2026 8:55 AM", action: "Upload TikTok Video", details: "Failed to upload due to file size limit", status: "error", duration: "12.3s", tokens: 890 },
  { id: "6", timestamp: "Aug 8, 2026 8:30 AM", action: "Analyze Engagement", details: "Computed engagement scores for last 7 days", status: "success", duration: "5.1s", tokens: 2100 },
  { id: "7", timestamp: "Aug 7, 2026 11:45 PM", action: "Batch Schedule", details: "Scheduled 5 posts across Instagram and Twitter", status: "success", duration: "4.7s", tokens: 1800 },
  { id: "8", timestamp: "Aug 7, 2026 10:20 PM", action: "Trend Analysis", details: "Scraped trending topics for content suggestions", status: "success", duration: "15.2s", tokens: 4500 },
  { id: "9", timestamp: "Aug 7, 2026 9:00 PM", action: "Content Repurpose", details: "Repurposed blog post into 3 social snippets", status: "success", duration: "6.3s", tokens: 2800 },
  { id: "10", timestamp: "Aug 7, 2026 8:15 PM", action: "DM Auto-Reply", details: "Failed to connect to Twitter API", status: "error", duration: "30.0s", tokens: 200 },
]

const statusIcons = {
  success: <CheckCircle className="h-3.5 w-3.5" style={{ color: "var(--color-success)" }} />,
  error: <AlertCircle className="h-3.5 w-3.5" style={{ color: "var(--color-error)" }} />,
  running: <Clock className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--color-info)" }} />,
}

export default function AgentHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const perPage = 8

  const filtered = mockHistory.filter(entry =>
    statusFilter ? entry.status === statusFilter : true
  )
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const columns: Column<HistoryEntry>[] = [
    {
      key: "timestamp",
      header: "Time",
      sortable: true,
      render: item => (
        <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
          {item.timestamp}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: item => (
        <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
          {item.action}
        </span>
      ),
    },
    {
      key: "details",
      header: "Details",
      render: item => (
        <span className="text-sm max-w-xs truncate block" style={{ color: "var(--text-secondary)" }}>
          {item.details}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: item => (
        <div className="flex items-center gap-1.5">
          {statusIcons[item.status]}
          <span className="text-sm capitalize" style={{ color: "var(--text-primary)" }}>
            {item.status}
          </span>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      sortable: true,
      render: item => (
        <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
          {item.duration}
        </span>
      ),
    },
    {
      key: "tokens",
      header: "Tokens",
      sortable: true,
      render: item => (
        <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
          {item.tokens.toLocaleString()}
        </span>
      ),
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}>
                Execution History
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Agent: Nova &middot; {mockHistory.length} executions
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Runs", value: mockHistory.length.toString() },
          { label: "Successful", value: mockHistory.filter(e => e.status === "success").length.toString() },
          { label: "Failed", value: mockHistory.filter(e => e.status === "error").length.toString() },
          { label: "Total Tokens", value: mockHistory.reduce((s, e) => s + e.tokens, 0).toLocaleString() },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="py-0">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
              <p className="text-xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          options={[
            { value: "", label: "All statuses" },
            { value: "success", label: "Success" },
            { value: "error", label: "Error" },
            { value: "running", label: "Running" },
          ]}
          value={statusFilter}
          onValueChange={v => { setStatusFilter(v); setPage(1) }}
          className="w-44"
        />
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-0">
            <DataTable columns={columns} data={paginated} />
          </CardContent>
        </Card>
      </motion.div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="justify-center" />
    </div>
  )
}
