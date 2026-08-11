"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  MessageSquare,
  TrendingUp,
  Calendar,
  Bot,
  AlertCircle,
  X,
  Settings,
} from "lucide-react"

interface Notification {
  id: string
  type: "message" | "achievement" | "alert" | "system" | "agent"
  title: string
  description: string
  time: Date
  read: boolean
  action?: string
  icon?: any
  color?: string
}

interface NotificationCenterProps {
  notifications?: Notification[]
  onMarkRead?: (id: string) => void
  onMarkAllRead?: () => void
  onDelete?: (id: string) => void
}

const defaultNotifications: Notification[] = [
  {
    id: "1",
    type: "agent",
    title: "Creator Agent completed",
    description: "Generated 5 LinkedIn posts for your review",
    time: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
    icon: Bot,
    color: "var(--accent)",
  },
  {
    id: "2",
    type: "achievement",
    title: "Achievement unlocked!",
    description: "You earned the 'First Steps' badge",
    time: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
    icon: TrendingUp,
    color: "var(--color-warning)",
  },
  {
    id: "3",
    type: "alert",
    title: "Post scheduled successfully",
    description: "Your Instagram post is scheduled for 2pm EST",
    time: new Date(Date.now() - 1000 * 60 * 60),
    read: true,
    icon: Calendar,
    color: "var(--color-success)",
  },
  {
    id: "4",
    type: "message",
    title: "New lead captured",
    description: "John Smith from TechCorp engaged with your post",
    time: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
    icon: MessageSquare,
    color: "var(--color-info)",
  },
  {
    id: "5",
    type: "system",
    title: "Weekly analytics ready",
    description: "Your performance report for this week is available",
    time: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
    icon: AlertCircle,
    color: "var(--text-muted)",
  },
]

export function NotificationCenter({
  notifications: initialNotifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState(
    initialNotifications || defaultNotifications
  )
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const unreadCount = notifications.filter((n) => !n.read).length

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    onMarkRead?.(id)
  }

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    onMarkAllRead?.()
  }

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    onDelete?.(id)
  }

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
          >
            {unreadCount}
          </motion.span>
        )}
      </Button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-96 z-50"
            >
              <Card className="shadow-2xl">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">Notifications</CardTitle>
                      {unreadCount > 0 && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "var(--accent)", color: "white" }}
                        >
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={filter === "all" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={filter === "unread" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setFilter("unread")}
                    >
                      Unread ({unreadCount})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs ml-auto"
                      onClick={handleMarkAllRead}
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-0 max-h-96 overflow-y-auto">
                  {filteredNotifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <BellOff
                        className="h-12 w-12 mx-auto mb-3"
                        style={{ color: "var(--text-muted)" }}
                      />
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        {filter === "unread" ? "No unread notifications" : "No notifications"}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "var(--border-default)" }}>
                      {filteredNotifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`p-4 hover:bg-[var(--bg-tertiary)] transition-colors ${
                            !notification.read ? "bg-[var(--bg-secondary)]" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${notification.color || "var(--accent)"} 15%, transparent)`,
                              }}
                            >
                              {notification.icon && (
                                <notification.icon
                                  className="h-5 w-5"
                                  style={{ color: notification.color || "var(--accent)" }}
                                />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{notification.title}</p>
                                {!notification.read && (
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: "var(--accent)" }}
                                  />
                                )}
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                {notification.description}
                              </p>
                              <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                                {formatTime(notification.time)}
                              </p>
                            </div>

                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleMarkRead(notification.id)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleDelete(notification.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>

                {notifications.length > 0 && (
                  <div className="p-3 border-t" style={{ borderColor: "var(--border-default)" }}>
                    <Button variant="ghost" size="sm" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Notification Settings
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
