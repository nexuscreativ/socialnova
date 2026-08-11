"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp,
  Users,
  MessageSquare,
  Star,
  Zap,
  Target,
  Award,
  Globe,
} from "lucide-react"

interface TickerItem {
  id: string
  icon: any
  text: string
  color: string
  timestamp: Date
}

interface SocialProofTickerProps {
  items?: TickerItem[]
  speed?: number
  pauseOnHover?: boolean
}

const defaultItems: TickerItem[] = [
  {
    id: "1",
    icon: Users,
    text: "2,847 new users joined today",
    color: "var(--color-success)",
    timestamp: new Date(),
  },
  {
    id: "2",
    icon: TrendingUp,
    text: "12,459 posts published this week",
    color: "var(--accent)",
    timestamp: new Date(),
  },
  {
    id: "3",
    icon: Star,
    text: "Sarah from NYC just earned 'Crowd Pleaser' badge",
    color: "var(--color-warning)",
    timestamp: new Date(),
  },
  {
    id: "4",
    icon: Zap,
    text: "847 AI credits used in the last hour",
    color: "var(--color-info)",
    timestamp: new Date(),
  },
  {
    id: "5",
    icon: Target,
    text: "TechCorp generated 142 leads this month",
    color: "var(--color-success)",
    timestamp: new Date(),
  },
  {
    id: "6",
    icon: Award,
    text: "Agency plan user hit 100k followers",
    color: "var(--accent)",
    timestamp: new Date(),
  },
  {
    id: "7",
    icon: Globe,
    text: "SocialNova now supports 14 platforms",
    color: "var(--color-info)",
    timestamp: new Date(),
  },
  {
    id: "8",
    icon: MessageSquare,
    text: "98% customer satisfaction rate",
    color: "var(--color-success)",
    timestamp: new Date(),
  },
]

export function SocialProofTicker({
  items = defaultItems,
  speed = 30,
  pauseOnHover = true,
}: SocialProofTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, speed * 100)

    return () => clearInterval(interval)
  }, [items.length, speed, isPaused])

  return (
    <div
      className="relative overflow-hidden py-3 px-4 rounded-lg"
      style={{ backgroundColor: "var(--bg-secondary)" }}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {/* Gradient masks for smooth edges */}
      <div
        className="absolute left-0 top-0 bottom-0 w-12 z-10"
        style={{
          background: "linear-gradient(to right, var(--bg-secondary), transparent)",
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-12 z-10"
        style={{
          background: "linear-gradient(to left, var(--bg-secondary), transparent)",
        }}
      />

      {/* Ticker content */}
      <div className="flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            {(() => {
              const item = items[currentIndex]
              const Icon = item.icon
              return (
                <>
                  <Icon className="h-4 w-4 shrink-0" style={{ color: item.color }} />
                  <span className="text-sm whitespace-nowrap">{item.text}</span>
                </>
              )
            })()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicator */}
      <div className="flex items-center justify-center gap-1.5 mt-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === currentIndex ? "w-4" : "w-1.5"
            }`}
            style={{
              backgroundColor:
                i === currentIndex ? "var(--accent)" : "var(--text-muted)",
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Compact version for inline use
export function SocialProofTickerCompact() {
  const [currentStat, setCurrentStat] = useState(0)

  const stats = [
    { label: "users", value: "2,847", icon: Users },
    { label: "posts", value: "12,459", icon: MessageSquare },
    { label: "leads", value: "8,923", icon: Target },
    { label: "engagement", value: "+47%", icon: TrendingUp },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStat}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-1"
        >
          {(() => {
            const stat = stats[currentStat]
            return (
              <>
                <stat.icon className="h-3 w-3" style={{ color: "var(--accent)" }} />
                <span className="font-medium">{stat.value}</span>
                <span style={{ color: "var(--text-muted)" }}>{stat.label}</span>
              </>
            )
          })()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
