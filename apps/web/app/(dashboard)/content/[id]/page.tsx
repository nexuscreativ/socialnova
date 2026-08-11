"use client"
import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Save,
  Trash2,
  Clock,
  CheckCircle,
  Eye,
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { FadeIn } from "@/components/engagement/motion"

const mockContent = {
  id: "1",
  title: "10 Tips for Social Media Growth in 2026",
  body: "Discover the key strategies that top brands are using to grow their social media presence in 2026.\n\n1. Leverage AI-powered content creation\n2. Build authentic communities\n3. Embrace short-form video\n4. Use data-driven decisions\n5. Collaborate with micro-influencers",
  platform: "Instagram",
  type: "carousel",
  status: "published",
  publishedAt: "Jul 28, 2026",
  hashtags: "#socialmedia #marketing #growth #tips",
  engagement: { likes: 1243, comments: 89, shares: 56, impressions: 15420 },
}

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { addToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: mockContent.title,
    body: mockContent.body,
    hashtags: mockContent.hashtags,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      addToast("Content updated successfully", "success")
    } catch {
      addToast("Failed to update content", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    addToast("Content deleted", "info")
    router.push("/content")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Published
              </Badge>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                on {mockContent.platform}
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Published {mockContent.publishedAt}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Eye className="h-4 w-4 mr-1.5" />
            Preview
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2">
          <FadeIn>
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                    Title
                  </label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="body" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                    Content
                  </label>
                  <Textarea
                    id="body"
                    rows={12}
                    value={form.body}
                    onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  />
                  <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                    {form.body.length} characters
                  </p>
                </div>
                <div>
                  <label htmlFor="hashtags" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                    Hashtags
                  </label>
                  <Input
                    id="hashtags"
                    value={form.hashtags}
                    onChange={e => setForm(p => ({ ...p, hashtags: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Engagement Stats */}
          <FadeIn delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" style={{ color: "var(--accent)" }} />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Impressions", value: mockContent.engagement.impressions.toLocaleString(), icon: Eye },
                    { label: "Likes", value: mockContent.engagement.likes.toLocaleString(), icon: Heart },
                    { label: "Comments", value: mockContent.engagement.comments.toString(), icon: MessageCircle },
                    { label: "Shares", value: mockContent.engagement.shares.toString(), icon: Share2 },
                  ].map(stat => (
                    <div
                      key={stat.label}
                      className="p-3 rounded-lg border text-center"
                      style={{ borderColor: "var(--border-default)" }}
                    >
                      <stat.icon className="h-4 w-4 mx-auto mb-1" style={{ color: "var(--accent)" }} />
                      <p className="text-lg font-bold" style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}>
                        {stat.value}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Meta */}
          <FadeIn delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Platform", value: mockContent.platform },
                  { label: "Type", value: mockContent.type },
                  { label: "Published", value: mockContent.publishedAt },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
                    <span style={{ color: "var(--text-primary)" }}>{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  )
}
