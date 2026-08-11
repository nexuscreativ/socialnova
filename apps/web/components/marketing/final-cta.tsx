"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, var(--accent) 0%, #FBBF24 50%, var(--accent) 100%)",
        }}
      />

      {/* Decorative patterns */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute top-10 left-10 w-72 h-72 rounded-full blur-3xl"
          style={{ backgroundColor: "white" }}
        />
        <div
          className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: "white" }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium mb-8 bg-white/20 text-white backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Sparkles className="h-4 w-4" />
            Start your free trial today
          </motion.div>

          <h2
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            Ready to transform
            <br />
            your social media?
          </h2>

          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Join 10,000+ creators and businesses using AI to automate their social media.
            Start free — no credit card required.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="text-base px-8 bg-white text-gray-900 hover:bg-white/90 font-bold group"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-white/60">
            No credit card required &bull; Free forever plan available
          </p>
        </motion.div>
      </div>
    </section>
  )
}
