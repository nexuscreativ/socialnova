"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Bot,
  Sparkles,
  ArrowRight,
  Play,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"
import { Slideshow } from "./slideshow"

/* -------------------------------------------------------------------------- */
/*  Floating Particles — pure CSS dots that drift slowly                       */
/* -------------------------------------------------------------------------- */
function FloatingParticles() {
  const particles = [
    { size: 3, x: 10, y: 15, delay: 0, duration: 18 },
    { size: 2, x: 25, y: 60, delay: 2, duration: 22 },
    { size: 4, x: 40, y: 25, delay: 4, duration: 16 },
    { size: 2, x: 55, y: 75, delay: 1, duration: 20 },
    { size: 3, x: 70, y: 35, delay: 3, duration: 19 },
    { size: 2, x: 85, y: 55, delay: 5, duration: 21 },
    { size: 3, x: 15, y: 80, delay: 2.5, duration: 17 },
    { size: 2, x: 60, y: 10, delay: 1.5, duration: 23 },
    { size: 4, x: 90, y: 20, delay: 3.5, duration: 15 },
    { size: 2, x: 35, y: 90, delay: 0.5, duration: 24 },
    { size: 3, x: 78, y: 85, delay: 4.5, duration: 18 },
    { size: 2, x: 5, y: 45, delay: 6, duration: 20 },
  ]

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full sn-particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: "rgba(249, 115, 22, 0.35)",
            animation: `particle-drift ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Animated Counter — counts up from 0 to target on mount                    */
/* -------------------------------------------------------------------------- */
function AnimatedCounter({
  target,
  suffix = "",
  duration = 2000,
}: {
  target: number
  suffix?: string
  duration?: number
}) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true

    const startTime = performance.now()
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }
    // Small delay so counter starts after stagger reveal
    const timer = setTimeout(() => requestAnimationFrame(step), 800)
    return () => clearTimeout(timer)
  }, [target, duration])

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Floating UI Mockup — tilts subtly toward mouse position                    */
/* -------------------------------------------------------------------------- */
function FloatingMockup() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Only enable pointer-driven tilt on devices that support precise hover
  // (mouse/trackpad). On touch screens the mousemove event only fires on tap,
  // which makes the board jump — so tilt stays static there.
  const canTilt = useRef(true)
  useEffect(() => {
    canTilt.current =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
  }, [])

  // Smooth spring physics for the tilt
  const springConfig = { stiffness: 100, damping: 20, mass: 0.5 }
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [8, -8]),
    springConfig
  )
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-8, 8]),
    springConfig
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || !canTilt.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      mouseX.set(x)
      mouseY.set(y)
    },
    [mouseX, mouseY]
  )

  const handleMouseLeave = useCallback(() => {
    if (!canTilt.current) return
    mouseX.set(0)
    mouseY.set(0)
  }, [mouseX, mouseY])

  return (
    <div
      ref={containerRef}
      onMouseMove={canTilt.current ? handleMouseMove : undefined}
      onMouseLeave={canTilt.current ? handleMouseLeave : undefined}
      className="relative w-full max-w-lg mx-auto mt-16 lg:mt-0"
      style={canTilt.current ? { perspective: 1000 } : undefined}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative rounded-2xl overflow-hidden border shadow-2xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
      >
        {/* Mock dashboard header */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-b"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div
            className="flex-1 ml-4 h-6 rounded-md text-xs flex items-center px-3"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              color: "var(--text-muted)",
            }}
          >
            app.socialnova.ai/dashboard
          </div>
        </div>

        {/* Mock dashboard content */}
        <div
          className="p-6 space-y-4"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          {/* Top stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Posts Today", value: "24", color: "#F97316" },
              { label: "Engagement", value: "+38%", color: "#22C55E" },
              { label: "Reach", value: "12.4K", color: "#3B82F6" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg p-3 border"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div
                  className="text-xs mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {stat.label}
                </div>
                <div
                  className="text-lg font-bold"
                  style={{
                    color: stat.color,
                    fontFamily: "var(--font-plus-jakarta)",
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Chart mockup */}
          <div
            className="rounded-lg border p-4"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "var(--border-default)",
            }}
          >
            <div
              className="text-xs mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Weekly Performance
            </div>
            <div className="flex items-end gap-1.5 h-20">
              {[40, 65, 55, 80, 70, 90, 85].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${height}%`,
                      backgroundColor:
                        i === 5
                          ? "var(--accent)"
                          : "color-mix(in srgb, var(--accent) 30%, transparent)",
                      transition: "height 0.6s ease",
                    }}
                  />
                </div>
              ))}
            </div>
            <div
              className="flex justify-between mt-2 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>

          {/* Agent activity */}
          <div
            className="rounded-lg border p-3"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "var(--border-default)",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--accent)" }}
              >
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <div
                  className="text-xs font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Nova is scheduling 6 posts...
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Optimized for peak engagement
                </div>
              </div>
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "#22C55E" }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating glow behind mockup */}
      <div
        className="absolute -inset-4 rounded-3xl blur-3xl opacity-20 -z-10"
        style={{ backgroundColor: "var(--accent)" }}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Stagger container variants for text reveal                                */
/* -------------------------------------------------------------------------- */
const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
}

const fadeUpItem = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

/* -------------------------------------------------------------------------- */
/*  Stats bar                                                                  */
/* -------------------------------------------------------------------------- */
const STATS = [
  { icon: Zap, label: "AI Agents", value: 12, suffix: "" },
  { icon: Users, label: "Platforms", value: 6, suffix: "+" },
  { icon: TrendingUp, label: "Automation", value: 24, suffix: "/7" },
]

/* -------------------------------------------------------------------------- */
/*  Hero                                                                       */
/* -------------------------------------------------------------------------- */
export function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null)

  // Parallax scroll — background moves slower than content
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })

  // Background parallax — moves up slower
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  // Content parallax — moves up slightly faster for depth
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"])
  // Mockup parallax — even faster for more depth
  const mockupY = useTransform(scrollYProgress, [0, 1], ["0%", "-5%"])
  // Opacity fades out as we scroll away
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden"
      style={{ perspective: "1200px" }}
    >
      {/* ---- Parallax Background Layer ---- */}
      <motion.div className="absolute inset-0 -z-10" style={{ y: bgY }}>
        <Slideshow />
        <FloatingParticles />
      </motion.div>

      {/* ---- Hero Content Layer ---- */}
      <motion.div
        className="relative z-10 flex flex-col lg:flex-row items-center max-w-7xl mx-auto px-6 min-h-screen pt-36 lg:pt-28 pb-32"
        style={{ y: contentY, opacity }}
      >
        {/* Left: Text content */}
        <motion.div
          className="flex-1 text-center lg:text-left"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={fadeUpItem} className="mb-8">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm border"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--accent) 40%, transparent)",
                backgroundColor:
                  "color-mix(in srgb, var(--accent) 10%, transparent)",
                color: "var(--accent)",
              }}
            >
              <Sparkles className="h-4 w-4" />
              AI-Powered Social Media Management
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUpItem}
            className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight leading-[1.15]"
            style={{
              fontFamily: "var(--font-plus-jakarta)",
              color: "#ffffff",
            }}
          >
            Your AI-Powered <br className="hidden md:block" />
            Social Media <br className="hidden md:block" />
            <span style={{ color: "var(--accent)" }}>Command Center</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            variants={fadeUpItem}
            className="mt-6 text-lg md:text-xl max-w-xl mx-auto lg:mx-0"
            style={{ color: "rgba(255, 255, 255, 0.85)" }}
          >
            12 specialized AI agents working in harmony to plan, create,
            publish, and optimize your content across every platform. Just chat
            with Nova and watch your social media run itself.
          </motion.p>

          {/* Animated Stats */}
          <motion.div
            variants={fadeUpItem}
            className="mt-10 flex flex-wrap justify-center lg:justify-start gap-8"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--accent) 15%, transparent)",
                  }}
                >
                  <stat.icon
                    className="h-5 w-5"
                    style={{ color: "var(--accent)" }}
                  />
                </div>
                <div>
                  <div
                    className="text-2xl font-bold leading-none"
                    style={{
                      fontFamily: "var(--font-plus-jakarta)",
                      color: "#ffffff",
                    }}
                  >
                    <AnimatedCounter
                      target={stat.value}
                      suffix={stat.suffix}
                    />
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUpItem}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="relative text-base px-8 group overflow-hidden sn-cta-glow"
              >
                <span className="relative z-10 flex items-center">
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                variant="secondary"
                size="lg"
                className="text-base px-8 backdrop-blur-sm"
              >
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </Link>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            variants={fadeUpItem}
            className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm"
            style={{ color: "rgba(255, 255, 255, 0.7)" }}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              6 platforms
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Cancel anytime
            </span>
          </motion.div>
        </motion.div>

        {/* Right: Floating Mockup */}
        <motion.div className="flex-1 w-full lg:w-auto" style={{ y: mockupY }}>
          <FloatingMockup />
        </motion.div>
      </motion.div>

      {/* ---- Bottom fade into next section ---- */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none -z-[5]"
        style={{
          background:
            "linear-gradient(to top, var(--bg-primary), transparent)",
        }}
      />
    </section>
  )
}
