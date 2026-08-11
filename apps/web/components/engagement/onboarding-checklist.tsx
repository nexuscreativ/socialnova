"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, Rocket, Sparkles, ArrowRight, X } from "lucide-react"

interface OnboardingStep {
  id: string
  title: string
  description: string
  completed: boolean
  action?: string
  href?: string
}

interface OnboardingChecklistProps {
  onComplete?: () => void
  onDismiss?: () => void
}

export function OnboardingChecklist({ onComplete, onDismiss }: OnboardingChecklistProps) {
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: "connect",
      title: "Connect your first platform",
      description: "Link LinkedIn, Instagram, or Twitter to get started",
      completed: false,
      action: "Connect",
      href: "/settings",
    },
    {
      id: "chat",
      title: "Chat with Nova",
      description: "Ask our AI assistant anything about your social media",
      completed: false,
      action: "Start Chat",
      href: "/chat",
    },
    {
      id: "create",
      title: "Create your first post",
      description: "Let AI generate content for your audience",
      completed: false,
      action: "Create",
      href: "/content",
    },
    {
      id: "schedule",
      title: "Schedule a post",
      description: "Set up automatic publishing at optimal times",
      completed: false,
      action: "Schedule",
      href: "/content",
    },
    {
      id: "gtm",
      title: "Explore GTM strategies",
      description: "Discover how AI can plan your product launches",
      completed: false,
      action: "Explore",
      href: "/gtm",
    },
  ])

  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem("onboarding-dismissed")
    if (dismissed) {
      setIsDismissed(true)
    }
  }, [])

  const completedCount = steps.filter((s) => s.completed).length
  const progress = (completedCount / steps.length) * 100

  const handleComplete = (stepId: string) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, completed: true } : step))
    )
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem("onboarding-dismissed", "true")
    onDismiss?.()
  }

  const handleFinish = () => {
    localStorage.setItem("onboarding-completed", "true")
    onComplete?.()
  }

  if (isDismissed || completedCount === steps.length) {
    return null
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Progress bar background */}
      <div
        className="absolute top-0 left-0 h-1 transition-all duration-500"
        style={{
          width: `${progress}%`,
          backgroundColor: "var(--accent)",
        }}
      />

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}
            >
              <Rocket className="h-5 w-5" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <CardTitle className="text-base">Getting Started</CardTitle>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {completedCount} of {steps.length} completed
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              step.completed ? "opacity-60" : "hover:bg-[var(--bg-tertiary)]"
            }`}
          >
            {step.completed ? (
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
            ) : (
              <Circle className="h-5 w-5 shrink-0" style={{ color: "var(--text-muted)" }} />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${step.completed ? "line-through" : ""}`}
                style={{ color: step.completed ? "var(--text-muted)" : "var(--text-primary)" }}
              >
                {step.title}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {step.description}
              </p>
            </div>
            {!step.completed && step.action && (
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0"
                onClick={() => handleComplete(step.id)}
              >
                {step.action}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        ))}

        {completedCount === steps.length - 1 && (
          <Button className="w-full mt-4" onClick={handleFinish}>
            <Sparkles className="h-4 w-4 mr-2" />
            Complete Setup
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
