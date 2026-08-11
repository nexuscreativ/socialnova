"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Trophy,
  Star,
  Flame,
  Target,
  Zap,
  Award,
  Medal,
  Crown,
  Gem,
  Lock,
  CheckCircle,
} from "lucide-react"

interface Achievement {
  id: string
  title: string
  description: string
  icon: any
  progress: number
  maxProgress: number
  unlocked: boolean
  unlockedAt?: Date
  rarity: "common" | "rare" | "epic" | "legendary"
  xp: number
}

interface AchievementSystemProps {
  showAll?: boolean
  compact?: boolean
}

const defaultAchievements: Achievement[] = [
  {
    id: "first-post",
    title: "First Steps",
    description: "Create your first post",
    icon: Star,
    progress: 1,
    maxProgress: 1,
    unlocked: true,
    unlockedAt: new Date("2026-08-01"),
    rarity: "common",
    xp: 10,
  },
  {
    id: "streak-7",
    title: "On Fire",
    description: "Maintain a 7-day posting streak",
    icon: Flame,
    progress: 5,
    maxProgress: 7,
    unlocked: false,
    rarity: "rare",
    xp: 50,
  },
  {
    id: "engagement-100",
    title: "Crowd Pleaser",
    description: "Get 100 engagements on a single post",
    icon: Target,
    progress: 72,
    maxProgress: 100,
    unlocked: false,
    rarity: "rare",
    xp: 75,
  },
  {
    id: "multi-platform",
    title: "Omnipresent",
    description: "Post on 5 different platforms",
    icon: Zap,
    progress: 3,
    maxProgress: 5,
    unlocked: false,
    rarity: "epic",
    xp: 100,
  },
  {
    id: "leads-50",
    title: "Lead Magnet",
    description: "Generate 50 leads",
    icon: Award,
    progress: 42,
    maxProgress: 50,
    unlocked: false,
    rarity: "epic",
    xp: 150,
  },
  {
    id: "gtm-launch",
    title: "Market Disruptor",
    description: "Complete your first GTM launch",
    icon: Crown,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    rarity: "legendary",
    xp: 500,
  },
]

const rarityColors = {
  common: "var(--text-muted)",
  rare: "var(--color-info)",
  epic: "var(--accent)",
  legendary: "var(--color-warning)",
}

const rarityLabels = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
}

export function AchievementSystem({ showAll = false, compact = false }: AchievementSystemProps) {
  const [achievements, setAchievements] = useState(defaultAchievements)
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalXP = achievements.reduce((sum, a) => sum + (a.unlocked ? a.xp : 0), 0)

  const displayAchievements = showAll ? achievements : achievements.slice(0, 4)

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5" style={{ color: "var(--color-warning)" }} />
          <span className="text-sm font-medium">{unlockedCount}/{achievements.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Gem className="h-5 w-5" style={{ color: "var(--accent)" }} />
          <span className="text-sm font-medium">{totalXP} XP</span>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" style={{ color: "var(--color-warning)" }} />
            <CardTitle className="text-base">Achievements</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {unlockedCount}/{achievements.length} unlocked
            </span>
            <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
              {totalXP} XP
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {displayAchievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedAchievement(achievement)}
              className={`relative p-3 rounded-xl border cursor-pointer transition-colors ${
                achievement.unlocked
                  ? "border-transparent"
                  : "border-[var(--border-default)] opacity-75"
              }`}
              style={{
                backgroundColor: achievement.unlocked
                  ? `color-mix(in srgb, ${rarityColors[achievement.rarity]} 10%, transparent)`
                  : "var(--bg-secondary)",
              }}
            >
              {/* Rarity indicator */}
              <div
                className="absolute top-2 right-2 w-2 h-2 rounded-full"
                style={{ backgroundColor: rarityColors[achievement.rarity] }}
              />

              {/* Icon */}
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center mb-2"
                style={{
                  backgroundColor: `color-mix(in srgb, ${rarityColors[achievement.rarity]} 20%, transparent)`,
                }}
              >
                {achievement.unlocked ? (
                  <achievement.icon
                    className="h-5 w-5"
                    style={{ color: rarityColors[achievement.rarity] }}
                  />
                ) : (
                  <Lock className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
                )}
              </div>

              {/* Title */}
              <p className="text-sm font-medium mb-1">{achievement.title}</p>

              {/* Progress */}
              {!achievement.unlocked && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                        backgroundColor: rarityColors[achievement.rarity],
                      }}
                    />
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                    {achievement.progress}/{achievement.maxProgress}
                  </p>
                </div>
              )}

              {achievement.unlocked && (
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-[10px] text-green-500">Unlocked</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {!showAll && (
          <Button variant="ghost" className="w-full mt-4">
            View All Achievements
          </Button>
        )}

        {/* Achievement Detail Modal */}
        <AnimatePresence>
          {selectedAchievement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setSelectedAchievement(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="w-80">
                  <CardContent className="p-6 text-center">
                    <div
                      className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${rarityColors[selectedAchievement.rarity]} 20%, transparent)`,
                      }}
                    >
                      <selectedAchievement.icon
                        className="h-10 w-10"
                        style={{ color: rarityColors[selectedAchievement.rarity] }}
                      />
                    </div>

                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${rarityColors[selectedAchievement.rarity]} 20%, transparent)`,
                        color: rarityColors[selectedAchievement.rarity],
                      }}
                    >
                      {rarityLabels[selectedAchievement.rarity]}
                    </span>

                    <h3 className="text-lg font-bold mt-2" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                      {selectedAchievement.title}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                      {selectedAchievement.description}
                    </p>

                    <div className="mt-4 flex items-center justify-center gap-4">
                      <span className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                        +{selectedAchievement.xp} XP
                      </span>
                      {selectedAchievement.unlocked && (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Unlocked {selectedAchievement.unlockedAt?.toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {!selectedAchievement.unlocked && (
                      <div className="mt-4">
                        <div className="h-2 rounded-full" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(selectedAchievement.progress / selectedAchievement.maxProgress) * 100}%`,
                              backgroundColor: rarityColors[selectedAchievement.rarity],
                            }}
                          />
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                          {selectedAchievement.progress}/{selectedAchievement.maxProgress}
                        </p>
                      </div>
                    )}

                    <Button className="w-full mt-4" onClick={() => setSelectedAchievement(null)}>
                      Close
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
