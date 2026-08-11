"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  X,
  GripVertical,
  Settings,
  Calendar,
  MessageSquare,
  TrendingUp,
  Users,
  BarChart3,
  Bot,
  Target,
  Zap,
} from "lucide-react"

interface Widget {
  id: string
  type: string
  title: string
  icon: any
  size: "sm" | "md" | "lg"
  enabled: boolean
}

interface DashboardWidgetsProps {
  widgets?: Widget[]
  onReorder?: (widgets: Widget[]) => void
  onToggle?: (id: string) => void
}

const defaultWidgets: Widget[] = [
  { id: "calendar", type: "calendar", title: "Content Calendar", icon: Calendar, size: "lg", enabled: true },
  { id: "activity", type: "activity", title: "Recent Activity", icon: MessageSquare, size: "md", enabled: true },
  { id: "engagement", type: "engagement", title: "Engagement Score", icon: TrendingUp, size: "md", enabled: true },
  { id: "platforms", type: "platforms", title: "Platform Overview", icon: Users, size: "lg", enabled: true },
  { id: "analytics", type: "analytics", title: "Quick Analytics", icon: BarChart3, size: "md", enabled: false },
  { id: "agents", type: "agents", title: "Agent Status", icon: Bot, size: "md", enabled: false },
  { id: "leads", type: "leads", title: "Recent Leads", icon: Target, size: "sm", enabled: false },
  { id: "credits", type: "credits", title: "AI Credits", icon: Zap, size: "sm", enabled: false },
]

export function DashboardWidgets({
  widgets: initialWidgets,
  onReorder,
  onToggle,
}: DashboardWidgetsProps) {
  const [widgets, setWidgets] = useState(initialWidgets || defaultWidgets)
  const [isEditing, setIsEditing] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)

  const enabledWidgets = widgets.filter((w) => w.enabled)
  const availableWidgets = widgets.filter((w) => !w.enabled)

  const handleToggle = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    )
    onToggle?.(id)
  }

  const handleDragStart = (id: string) => {
    setDraggedWidget(id)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (draggedWidget && draggedWidget !== id) {
      const newWidgets = [...widgets]
      const draggedIndex = newWidgets.findIndex((w) => w.id === draggedWidget)
      const targetIndex = newWidgets.findIndex((w) => w.id === id)
      const [removed] = newWidgets.splice(draggedIndex, 1)
      newWidgets.splice(targetIndex, 0, removed)
      setWidgets(newWidgets)
      onReorder?.(newWidgets)
    }
  }

  const handleDragEnd = () => {
    setDraggedWidget(null)
  }

  return (
    <div className="space-y-4">
      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Dashboard Widgets
        </h3>
        <Button
          variant={isEditing ? "default" : "secondary"}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Settings className="h-4 w-4 mr-2" />
          {isEditing ? "Done" : "Customize"}
        </Button>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enabledWidgets.map((widget) => (
          <motion.div
            key={widget.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative ${widget.size === "lg" ? "md:col-span-2" : ""}`}
            draggable={isEditing}
            onDragStart={() => handleDragStart(widget.id)}
            onDragOver={(e) => handleDragOver(e, widget.id)}
            onDragEnd={handleDragEnd}
          >
            <Card className={`h-full ${isEditing ? "border-dashed cursor-move" : ""}`}>
              {isEditing && (
                <div className="absolute top-2 left-2 z-10">
                  <GripVertical className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                </div>
              )}

              {isEditing && (
                <button
                  onClick={() => handleToggle(widget.id)}
                  className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <widget.icon className="h-4 w-4" style={{ color: "var(--accent)" }} />
                  <CardTitle className="text-sm">{widget.title}</CardTitle>
                </div>
              </CardHeader>

              <CardContent>
                <div className="h-32 flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
                  <p className="text-sm">Widget content</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Add Widget Button */}
        {isEditing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="h-full border-dashed">
              <CardContent className="h-full flex items-center justify-center">
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Available Widgets Panel */}
      {isEditing && availableWidgets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Available Widgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableWidgets.map((widget) => (
                  <Button
                    key={widget.id}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggle(widget.id)}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    {widget.title}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Widget Presets */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Layouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const preset = defaultWidgets.map((w) => ({
                      ...w,
                      enabled: ["calendar", "activity", "platforms"].includes(w.id),
                    }))
                    setWidgets(preset)
                  }}
                >
                  Overview
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const preset = defaultWidgets.map((w) => ({
                      ...w,
                      enabled: ["engagement", "analytics", "leads"].includes(w.id),
                    }))
                    setWidgets(preset)
                  }}
                >
                  Analytics
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const preset = defaultWidgets.map((w) => ({
                      ...w,
                      enabled: ["agents", "credits", "activity"].includes(w.id),
                    }))
                    setWidgets(preset)
                  }}
                >
                  Agents
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
