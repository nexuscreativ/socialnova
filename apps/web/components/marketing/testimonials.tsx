"use client"

import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    quote:
      "SocialNova completely transformed how we handle social media. The AI agents create content that sounds exactly like our brand voice. We went from 2 hours daily to 15 minutes.",
    name: "Sarah Chen",
    role: "Head of Marketing",
    company: "GrowthStack",
    rotation: -1,
  },
  {
    quote:
      "I was skeptical about AI running my social accounts, but Nova and her team are incredible. Our engagement is up 340% in three months. The timing agent alone is worth the price.",
    name: "Marcus Rodriguez",
    role: "Founder & CEO",
    company: "PixelForge Studios",
    rotation: 1.5,
  },
  {
    quote:
      "As an agency managing 20+ client accounts, SocialNova is our secret weapon. The brand guardian catches issues before they become problems. Enterprise plan is a no-brainer.",
    name: "Emily Park",
    role: "Agency Director",
    company: "Nova Media Co",
    rotation: -0.5,
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40, rotateX: 5 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

function StarRating() {
  return (
    <div className="flex gap-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className="h-4 w-4 fill-current"
          style={{ color: "#FBBF24" }}
        />
      ))}
    </div>
  )
}

export function Testimonials() {
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
            Testimonials
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            What our users say
          </h2>
          <p
            className="mt-4 text-lg max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Join thousands of creators and businesses who trust SocialNova to manage their social media.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          style={{ perspective: 1000 }}
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              className="relative rounded-xl border p-6 md:p-8"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-default)",
                transform: `rotate(${testimonial.rotation}deg)`,
              }}
              variants={cardVariants}
              whileHover={{
                y: -4,
                rotate: 0,
                boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.15)",
                transition: { duration: 0.3 },
              }}
            >
              {/* Quote icon */}
              <Quote
                className="h-8 w-8 mb-4 opacity-20"
                style={{ color: "var(--accent)" }}
              />

              <StarRating />

              <blockquote
                className="text-sm md:text-base leading-relaxed mb-6"
                style={{ color: "var(--text-secondary)" }}
              >
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3">
                {/* Avatar placeholder */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{
                    backgroundColor: "var(--accent)",
                    fontFamily: "var(--font-plus-jakarta)",
                  }}
                >
                  {testimonial.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div
                    className="font-semibold text-sm"
                    style={{
                      fontFamily: "var(--font-plus-jakarta)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {testimonial.name}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
