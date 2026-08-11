"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Shield, Lock, Smartphone, Key, AlertTriangle, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"

export default function SecurityPage() {
  const { addToast } = useToast()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [show2FA, setShow2FA] = useState(false)
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" })
  const [saving, setSaving] = useState(false)
  const [twoFAEnabled, setTwoFAEnabled] = useState(true)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      addToast("Passwords do not match", "error")
      return
    }
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      addToast("Password changed successfully", "success")
      setShowPasswordModal(false)
      setPasswords({ current: "", new: "", confirm: "" })
    } catch {
      addToast("Failed to change password", "error")
    } finally {
      setSaving(false)
    }
  }

  const sessions = [
    { device: "Chrome on macOS", location: "New York, US", lastActive: "Current session", current: true },
    { device: "Safari on iPhone", location: "New York, US", lastActive: "2 hours ago", current: false },
    { device: "Firefox on Windows", location: "Boston, US", lastActive: "3 days ago", current: false },
  ]

  return (
    <div className="space-y-6">
      {/* Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Password</CardTitle>
              <CardDescription>Last changed 30 days ago</CardDescription>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowPasswordModal(true)}>
              <Lock className="h-4 w-4 mr-1.5" />
              Change password
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={twoFAEnabled ? "success" : "default"}>
                {twoFAEnabled ? "Enabled" : "Disabled"}
              </Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTwoFAEnabled(!twoFAEnabled)
                  addToast(twoFAEnabled ? "2FA disabled" : "2FA enabled", "success")
                }}
              >
                <Smartphone className="h-4 w-4 mr-1.5" />
                {twoFAEnabled ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
        </CardHeader>
        {twoFAEnabled && (
          <CardContent>
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: "color-mix(in srgb, var(--color-success) 10%, transparent)" }}>
              <Shield className="h-5 w-5 shrink-0" style={{ color: "var(--color-success)" }} />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Two-factor authentication is protecting your account via authenticator app.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Manage your active login sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.map((session, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ borderColor: "var(--border-default)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "var(--bg-tertiary)" }}
                  >
                    <Smartphone className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {session.device}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {session.location} &middot; {session.lastActive}
                    </p>
                  </div>
                </div>
                {session.current ? (
                  <Badge variant="success">Current</Badge>
                ) : (
                  <Button variant="ghost" size="sm" className="text-[var(--color-error)]">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Change Password Modal */}
      <Modal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password" size="md">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
              Current password
            </label>
            <Input
              id="currentPassword"
              type="password"
              value={passwords.current}
              onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
              New password
            </label>
            <Input
              id="newPassword"
              type="password"
              value={passwords.new}
              onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
              Confirm new password
            </label>
            <Input
              id="confirmNewPassword"
              type="password"
              value={passwords.confirm}
              onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Changing..." : "Change password"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
