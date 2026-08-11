"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Rocket,
  Calendar,
  DollarSign,
  Target,
  Users,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { FadeIn } from "@/components/engagement/motion"

export default function NewCampaignPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    objective: "",
    platforms: [] as string[],
    budget: "",
    startDate: "",
    endDate: "",
    targetAudience: "",
  })

  const togglePlatform = (platform: string) => {
    setForm(p => ({
      ...p,
      platforms: p.platforms.includes(platform)
        ? p.platforms.filter(pl => pl !== platform)
        : [...p.platforms, platform],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.objective) {
      addToast("Name and objective are required", "error")
      return
    }
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      addToast("Campaign created successfully!", "success")
      router.push("/campaigns")
    } catch {
      addToast("Failed to create campaign", "error")
    } finally {
      setSaving(false)
    }
  }

  const platforms = ["Instagram", "Twitter", "LinkedIn", "TikTok", "Facebook", "YouTube"]
  const objectives = [
    { value: "awareness", label: "Brand Awareness" },
    { value: "traffic", label: "Drive Traffic" },
    { value: "conversions", label: "Conversions" },
    { value: "engagement", label: "Engagement" },
    { value: "leads", label: "Lead Generation" },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}>
            New Campaign
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Create a new marketing campaign with AI assistance
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Basic information about your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Campaign name
                </label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Product Launch 2026"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Description
                </label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="What is this campaign about?"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="objective" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Objective
                </label>
                <Select
                  options={objectives}
                  value={form.objective}
                  onValueChange={v => setForm(p => ({ ...p, objective: v }))}
                  placeholder="Select campaign objective"
                />
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle>Platforms</CardTitle>
              <CardDescription>Select where to run this campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {platforms.map(platform => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className="flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all"
                    style={{
                      borderColor: form.platforms.includes(platform) ? "var(--accent)" : "var(--border-default)",
                      backgroundColor: form.platforms.includes(platform) ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "var(--bg-secondary)",
                      color: form.platforms.includes(platform) ? "var(--accent)" : "var(--text-secondary)",
                    }}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle>Schedule & Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                    Start date
                  </label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                    End date
                  </label>
                  <Input
                    id="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="budget" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Budget
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                  <Input
                    id="budget"
                    type="number"
                    placeholder="0.00"
                    value={form.budget}
                    onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="audience" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Target audience
                </label>
                <Input
                  id="audience"
                  placeholder="e.g., Young professionals, 25-34"
                  value={form.targetAudience}
                  onChange={e => setForm(p => ({ ...p, targetAudience: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Rocket className="h-4 w-4" />
                Create campaign
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
