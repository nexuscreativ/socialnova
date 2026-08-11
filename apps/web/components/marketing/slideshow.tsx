"use client"

import { useState, useEffect, useCallback } from "react"

/**
 * Cinematic background slideshow with real photographic scenes.
 * Each slide is a high-quality image representing a platform feature.
 * Transitions use CSS crossfade with a subtle Ken Burns zoom effect.
 */

interface Slide {
  id: number
  image: string
  label: string
}

const SLIDES: Slide[] = [
  {
    id: 0,
    label: "Social Media Dashboard",
    image: "/hero/hero-1-dashboard.jpg",
  },
  {
    id: 1,
    label: "AI Content Generation",
    image: "/hero/hero-2-content.jpg",
  },
  {
    id: 2,
    label: "Analytics & Insights",
    image: "/hero/hero-3-analytics.jpg",
  },
  {
    id: 3,
    label: "Multi-Platform Publishing",
    image: "/hero/hero-4-publishing.jpg",
  },
  {
    id: 4,
    label: "Engagement & Growth",
    image: "/hero/hero-5-growth.jpg",
  },
]

const SLIDE_DURATION = 5000 // 5s per slide
const CROSSFADE_DURATION = 1000 // 1s crossfade

export function Slideshow() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const advanceSlide = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
      // Allow the new slide to render before we consider the transition done
      requestAnimationFrame(() => {
        setIsTransitioning(false)
      })
    }, CROSSFADE_DURATION / 2)
  }, [])

  useEffect(() => {
    const interval = setInterval(advanceSlide, SLIDE_DURATION)
    return () => clearInterval(interval)
  }, [advanceSlide])

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {SLIDES.map((slide, index) => {
        const isActive = index === currentSlide
        return (
          <div
            key={slide.id}
            className="absolute inset-0"
            style={{
              // Fallback gradient behind each image while it loads
              background: `
                linear-gradient(135deg, rgba(12, 18, 32, 0.55) 0%, rgba(26, 26, 46, 0.45) 100%),
                url("${slide.image}")
              `,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: isActive ? 1 : 0,
              transform: isActive ? "scale(1)" : "scale(1.08)",
              transitionProperty: "opacity, transform",
              transitionDuration: `${CROSSFADE_DURATION}ms, ${CROSSFADE_DURATION + 2000}ms`,
              transitionTimingFunction: "ease-in-out, ease-out",
            }}
          />
        )
      })}

      {/* Vignette overlay for cinematic depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* Gradient overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.15) 100%)",
        }}
      />
    </div>
  )
}