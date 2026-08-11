"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect, useCallback } from "react"

const stats = [
  { value: 10000, suffix: "+", label: "Creators" },
  { value: 1000000, suffix: "+", label: "Posts Generated" },
  { value: 99.9, suffix: "%", label: "Uptime" },
  { value: 24, suffix: "/7", label: "AI Coverage" },
]

function AnimatedStat({
  value,
  suffix,
  label,
  delay = 0,
}: {
  value: number
  suffix: string
  label: string
  delay?: number
}) {
  const [display, setDisplay] = useState("0")
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const hasAnimated = useRef(false)

  const animate = useCallback(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true

    const duration = 2000
    const startTime = performance.now()

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * value

      // Format based on the target value
      if (value >= 1000000) {
        const millions = (current / 1000000).toFixed(0)
        setDisplay(`${millions}M${suffix}`)
      } else if (value >= 1000) {
        const thousands = (current / 1000).toFixed(0)
        setDisplay(`${thousands}K${suffix}`)
      } else if (value % 1 !== 0) {
        setDisplay(`${current.toFixed(1)}${suffix}`)
      } else {
        setDisplay(`${Math.round(current)}${suffix}`)
      }

      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }

    requestAnimationFrame(step)
  }, [value, suffix])

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(animate, delay)
      return () => clearTimeout(timer)
    }
  }, [isInView, animate, delay])

  return (
    <motion.div
      ref={ref}
      className="text-center"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: delay / 1000 }}
    >
      <div
        className="text-4xl md:text-5xl lg:text-6xl font-bold"
        style={{
          fontFamily: "var(--font-plus-jakarta)",
          background: "linear-gradient(135deg, var(--accent) 0%, #FBBF24 50%, var(--accent) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {display}
      </div>
      <div
        className="mt-2 text-sm md:text-base font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </div>
    </motion.div>
  )
}

export function Stats() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%)",
        }}
      />

      {/* Decorative elements */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
        style={{ backgroundColor: "var(--accent)" }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
        style={{ backgroundColor: "#FBBF24" }}
      />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            Built for scale
          </h2>
          <p
            className="mt-4 text-lg max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            From solo creators to enterprise teams, SocialNova powers your growth.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <AnimatedStat
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={i * 150}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
