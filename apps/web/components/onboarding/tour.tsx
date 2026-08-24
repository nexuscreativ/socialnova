"use client"
import { useEffect, useState } from "react"
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const STEPS = [
  { title: "Welcome to SocialNova", description: "Your AI co-pilot for 14 platforms — 12 agents, one chat.", target: null },
  { title: "Dashboard", description: "Track followers, engagement, and agent activity at a glance.", target: "dashboard" },
  { title: "Chat with Nova", description: "Ask Nova to draft, schedule, or analyze — try streaming and conversation history.", target: "chat" },
  { title: "You're all set", description: "Press Cmd+K anytime to jump, check the bell for live notifications, and explore CMS under /settings/content.", target: null },
]

export function OnboardingTour() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const seen = typeof window !== "undefined" ? localStorage.getItem("socialnova-tour-seen") : "1"
    if (!seen) setOpen(true)
  }, [])

  const close = () => {
    setOpen(false)
    try { localStorage.setItem("socialnova-tour-seen", "1") } catch {}
  }
  const next = () => {
    if (step + 1 >= STEPS.length) close()
    else setStep(s => s + 1)
  }
  const prev = () => setStep(s => Math.max(0, s - 1))

  if (!open) return null
  const cur = STEPS[step]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <Card className="relative w-[min(480px,100vw-2rem)] shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--accent)" }}>
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-base">{cur.title}</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={close}><X className="h-4 w-4" /></Button>
          </div>
          <CardDescription>{cur.description}</CardDescription>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Step {step + 1} of {STEPS.length}</p>
        </CardHeader>
        <CardContent className="flex justify-between">
          <Button variant="ghost" size="sm" onClick={prev} disabled={step === 0}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={close}>Skip</Button>
            <Button size="sm" onClick={next}>{step + 1 === STEPS.length ? "Done" : <><ChevronRight className="h-4 w-4 mr-1" /> Next</>}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
