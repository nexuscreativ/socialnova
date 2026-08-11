"use client"

import { motion } from "framer-motion"
import {
  Crown,
  Palette,
  Clock,
  TrendingUp,
  Link2,
  Shield,
  Megaphone,
  Search,
  CalendarCheck,
  Headphones,
  AlertTriangle,
  Mic,
} from "lucide-react"

const agents = [
  {
    name: "Nova",
    role: "Orchestrator",
    description: "Coordinates your entire AI team, delegates tasks, and ensures seamless collaboration.",
    icon: Crown,
    color: "#F97316",
  },
  {
    name: "Creator",
    role: "Content Engine",
    description: "Writes captions, threads, and stories tailored to your brand voice and audience.",
    icon: Palette,
    color: "#8B5CF6",
  },
  {
    name: "Timing",
    role: "Scheduling AI",
    description: "Analyzes audience behavior to find the perfect posting time for every platform.",
    icon: Clock,
    color: "#3B82F6",
  },
  {
    name: "Growth",
    role: "Audience Builder",
    description: "Identifies growth opportunities, hashtag strategies, and engagement tactics.",
    icon: TrendingUp,
    color: "#22C55E",
  },
  {
    name: "Connector",
    role: "Platform Manager",
    description: "Manages all your social platform connections and cross-posting workflows.",
    icon: Link2,
    color: "#06B6D4",
  },
  {
    name: "Guardian",
    role: "Brand Protector",
    description: "Monitors brand sentiment, flags risks, and ensures consistent brand voice.",
    icon: Shield,
    color: "#EAB308",
  },
  {
    name: "GTM",
    role: "Go-to-Market",
    description: "Plans product launches, campaigns, and promotional content calendars.",
    icon: Megaphone,
    color: "#EC4899",
  },
  {
    name: "MarketResearch",
    role: "Trend Analyst",
    description: "Tracks industry trends, competitor activity, and content performance benchmarks.",
    icon: Search,
    color: "#14B8A6",
  },
  {
    name: "LaunchCoordinator",
    role: "Campaign Manager",
    description: "Orchestrates multi-platform launches with coordinated timing and messaging.",
    icon: CalendarCheck,
    color: "#F97316",
  },
  {
    name: "Support",
    role: "Community Manager",
    description: "Responds to DMs, comments, and mentions with personalized, on-brand replies.",
    icon: Headphones,
    color: "#6366F1",
  },
  {
    name: "Escalation",
    role: "Issue Resolver",
    description: "Detects crises early, escalates urgent issues, and manages reputation events.",
    icon: AlertTriangle,
    color: "#EF4444",
  },
  {
    name: "Voice",
    role: "Audio Content",
    description: "Generates voiceovers, podcast scripts, and audio content for multi-format publishing.",
    icon: Mic,
    color: "#A855F7",
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

export function AgentsGrid() {
  return (
    <section className="py-24" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border mb-6"
            style={{
              borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
              color: "var(--accent)",
            }}
          >
            Meet Your AI Team
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            12 specialized agents working for you
          </h2>
          <p
            className="mt-4 text-lg max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Each agent is an expert in its domain. Together, they form your personal social media dream team.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {agents.map((agent) => (
            <motion.div
              key={agent.name}
              className="group relative rounded-xl border p-5 cursor-default transition-all duration-300"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-default)",
              }}
              variants={cardVariants}
              whileHover={{
                y: -4,
                boxShadow: `0 12px 40px -8px color-mix(in srgb, ${agent.color} 25%, transparent)`,
                borderColor: `color-mix(in srgb, ${agent.color} 50%, transparent)`,
              }}
            >
              {/* Agent icon */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${agent.color} 15%, transparent)`,
                  }}
                >
                  <agent.icon
                    className="h-5 w-5"
                    style={{ color: agent.color }}
                  />
                </div>
                <div>
                  <h3
                    className="font-bold text-sm"
                    style={{
                      fontFamily: "var(--font-plus-jakarta)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {agent.name}
                  </h3>
                  <p
                    className="text-xs font-medium"
                    style={{ color: agent.color }}
                  >
                    {agent.role}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {agent.description}
              </p>

              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(600px at var(--mouse-x, 50%) var(--mouse-y, 50%), color-mix(in srgb, ${agent.color} 6%, transparent), transparent 40%)`,
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
