"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Bell, Mail, MessageSquare, Megaphone, Bot, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

interface NotificationSetting {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  email: boolean
  push: boolean
  inApp: boolean
}

const initialSettings: NotificationSetting[] = [
  {
    id: "content",
    label: "Content Published",
    description: "When AI publishes content to your platforms",
    icon: <Megaphone className="h-4 w-4" />,
    email: true,
    push: true,
    inApp: true,
  },
  {
    id: "agent",
    label: "Agent Activity",
    description: "When agents complete tasks or need attention",
    icon: <Bot className="h-4 w-4" />,
    email: false,
    push: true,
    inApp: true,
  },
  {
    id: "engagement",
    label: "Engagement Alerts",
    description: "High engagement or viral content alerts",
    icon: <MessageSquare className="h-4 w-4" />,
    email: true,
    push: true,
    inApp: true,
  },
  {
    id: "billing",
    label: "Billing Updates",
    description: "Invoice and subscription changes",
    icon: <Bell className="h-4 w-4" />,
    email: true,
    push: false,
    inApp: true,
  },
  {
    id: "security",
    label: "Security Alerts",
    description: "Login attempts and security warnings",
    icon: <AlertTriangle className="h-4 w-4" />,
    email: true,
    push: true,
    inApp: true,
  },
  {
    id: "weekly",
    label: "Weekly Digest",
    description: "Weekly summary of your social performance",
    icon: <Mail className="h-4 w-4" />,
    email: true,
    push: false,
    inApp: false,
  },
]

export default function NotificationsPage() {
  const { addToast } = useToast()
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)

  const toggleSetting = (id: string, channel: "email" | "push" | "inApp") => {
    setSettings(prev =>
      prev.map(s => (s.id === id ? { ...s, [channel]: !s[channel] } : s))
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      addToast("Notification preferences saved", "success")
    } catch {
      addToast("Failed to save preferences", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full" role="grid">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-default)" }}>
                  <th className="text-left py-3 px-2 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Notification
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Email
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Push
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    In-App
                  </th>
                </tr>
              </thead>
              <tbody>
                {settings.map(setting => (
                  <tr key={setting.id} className="border-b last:border-0" style={{ borderColor: "var(--border-default)" }}>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--accent)" }}
                        >
                          {setting.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{setting.label}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{setting.description}</p>
                        </div>
                      </div>
                    </td>
                    {(["email", "push", "inApp"] as const).map(channel => (
                      <td key={channel} className="text-center py-3 px-4">
                        <button
                          onClick={() => toggleSetting(setting.id, channel)}
                          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                          style={{
                            backgroundColor: setting[channel] ? "var(--accent)" : "var(--bg-tertiary)",
                          }}
                          role="switch"
                          aria-checked={setting[channel]}
                          aria-label={`${setting.label} ${channel} notification`}
                        >
                          <motion.span
                            layout
                            className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm"
                            animate={{ x: setting[channel] ? 14 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            style={{ marginLeft: "3px" }}
                          />
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            "Save preferences"
          )}
        </Button>
      </div>
    </div>
  )
}
