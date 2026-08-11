"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Camera, Save, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/toast"

export default function ProfilePage() {
  const { addToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "Alex Morgan",
    email: "alex@socialnova.io",
    bio: "Social media strategist and content creator. Passionate about AI-driven marketing.",
    company: "SocialNova",
    timezone: "America/New_York",
    website: "https://alexmo.dev",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      addToast("Profile updated successfully", "success")
    } catch {
      addToast("Failed to update profile", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>This is your public avatar across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar size="xl" fallback="AM" />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <Button variant="secondary" size="sm" type="button">Upload photo</Button>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                Full name
              </label>
              <Input
                id="name"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
              Bio
            </label>
            <Textarea
              id="bio"
              rows={3}
              value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="Tell us about yourself"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                Company
              </label>
              <Input
                id="company"
                value={form.company}
                onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="website" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                Website
              </label>
              <Input
                id="website"
                type="url"
                value={form.website}
                onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
              Timezone
            </label>
            <Input
              id="timezone"
              value={form.timezone}
              onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" type="button">Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save changes
            </span>
          )}
        </Button>
      </div>
    </form>
  )
}
