"use client"

import { motion, useAnimationControls } from "framer-motion"
import { useEffect, useRef } from "react"

const logos = [
  "Vogue",
  "TechCrunch",
  "Forbes",
  "Wired",
  "The Verge",
  "Mashable",
  "Buffer",
  "Hootsuite",
]

function InfiniteMarquee({ children }: { children: React.ReactNode }) {
  const controls = useAnimationControls()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const animate = async () => {
      await controls.start({
        x: ["0%", "-50%"],
        transition: {
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 30,
            ease: "linear",
          },
        },
      })
    }
    animate()
  }, [controls])

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Fade masks */}
      <div
        className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to right, var(--bg-primary), transparent)",
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to left, var(--bg-primary), transparent)",
        }}
      />
      <motion.div
        className="flex items-center gap-12"
        animate={controls}
        style={{ width: "max-content" }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  )
}

export function SocialProof() {
  return (
    <section className="py-16 overflow-hidden" style={{ backgroundColor: "var(--bg-primary)" }}>
      <motion.div
        className="max-w-7xl mx-auto px-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
      >
        <p
          className="text-sm font-medium uppercase tracking-widest mb-8"
          style={{ color: "var(--text-muted)" }}
        >
          Trusted by 10,000+ creators worldwide
        </p>

        <InfiniteMarquee>
          {logos.map((logo) => (
            <div
              key={logo}
              className="flex-shrink-0 px-6 py-3 rounded-lg select-none"
              style={{
                color: "var(--text-muted)",
                opacity: 0.45,
                fontFamily: "var(--font-plus-jakarta)",
                fontSize: "1.125rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              {logo}
            </div>
          ))}
        </InfiniteMarquee>

        {/* Static trust badges */}
        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {["SOC 2 Compliant", "GDPR Ready", "Enterprise Grade", "99.9% Uptime"].map(
            (badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium border"
                style={{
                  borderColor: "var(--border-default)",
                  color: "var(--text-muted)",
                  backgroundColor: "var(--bg-secondary)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "var(--accent)" }}
                />
                {badge}
              </span>
            )
          )}
        </motion.div>
      </motion.div>
    </section>
  )
}
