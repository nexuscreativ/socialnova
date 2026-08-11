"use client"

import { motion } from "framer-motion"
import {
  Link2,
  Bot,
  Rocket,
  Instagram,
  Twitter,
  Linkedin,
  Music,
  Youtube,
} from "lucide-react"

const steps = [
  {
    number: 1,
    title: "Connect Your Platforms",
    description:
      "Link your Instagram, Twitter, LinkedIn, TikTok, and YouTube accounts in seconds. Your data stays encrypted and secure.",
    icon: Link2,
    platforms: [
      { icon: Instagram, label: "Instagram" },
      { icon: Twitter, label: "Twitter" },
      { icon: Linkedin, label: "LinkedIn" },
      { icon: Music, label: "TikTok" },
      { icon: Youtube, label: "YouTube" },
    ],
  },
  {
    number: 2,
    title: "AI Agents Get to Work",
    description:
      "12 specialized AI agents analyze your brand voice, audience, and trends to create, schedule, and optimize your content.",
    icon: Bot,
    detail: "Nova, our orchestrator, coordinates your entire team.",
  },
  {
    number: 3,
    title: "Publish & Grow",
    description:
      "Auto-schedule at peak times, track performance in real time, and iterate with AI-powered insights to grow your audience.",
    icon: Rocket,
    detail: "Watch your engagement metrics climb week over week.",
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

export function HowItWorks() {
  return (
    <section
      className="py-24"
      style={{ backgroundColor: "var(--bg-secondary)" }}
    >
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
            How It Works
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            Three steps to social media mastery
          </h2>
          <p
            className="mt-4 text-lg max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Get started in minutes, not months. No learning curve, no complex setup.
          </p>
        </motion.div>

        <motion.div
          className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {/* Connecting line (desktop) */}
          <div
            className="hidden md:block absolute top-24 left-[20%] right-[20%] h-px"
            style={{
              background:
                "linear-gradient(to right, transparent, var(--accent), var(--accent), transparent)",
              opacity: 0.3,
            }}
          />

          {steps.map((step) => (
            <motion.div
              key={step.number}
              className="relative flex flex-col items-center text-center"
              variants={itemVariants}
            >
              {/* Step number circle */}
              <div className="relative mb-6">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center relative z-10"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                    border: "2px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                  }}
                >
                  <step.icon
                    className="h-8 w-8"
                    style={{ color: "var(--accent)" }}
                  />
                </div>
                <div
                  className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white z-20"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {step.number}
                </div>
              </div>

              {/* Content */}
              <h3
                className="text-xl font-bold mb-3"
                style={{
                  fontFamily: "var(--font-plus-jakarta)",
                  color: "var(--text-primary)",
                }}
              >
                {step.title}
              </h3>
              <p
                className="text-sm leading-relaxed max-w-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {step.description}
              </p>

              {/* Platform icons for step 1 */}
              {step.platforms && (
                <div className="mt-5 flex items-center gap-3">
                  {step.platforms.map((platform) => (
                    <div
                      key={platform.label}
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: "var(--bg-tertiary)",
                        border: "1px solid var(--border-default)",
                      }}
                      title={platform.label}
                    >
                      <platform.icon
                        className="h-4 w-4"
                        style={{ color: "var(--text-muted)" }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Detail text for step 2 & 3 */}
              {step.detail && (
                <p
                  className="mt-4 text-xs font-medium px-3 py-1.5 rounded-md"
                  style={{
                    color: "var(--accent)",
                    backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
                  }}
                >
                  {step.detail}
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
