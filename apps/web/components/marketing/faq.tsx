"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight } from "lucide-react"

const faqs = [
  {
    question: "What AI models does SocialNova use?",
    answer:
      "SocialNova leverages a combination of state-of-the-art large language models fine-tuned for social media content creation. Our proprietary models are trained on millions of high-performing posts across platforms, ensuring content that resonates with your specific audience while maintaining your unique brand voice.",
  },
  {
    question: "How many social platforms can I connect?",
    answer:
      "SocialNova supports 6 major platforms: Instagram, Twitter/X, LinkedIn, TikTok, YouTube, and Facebook. Free plans can connect 2 platforms, Pro plans support all 6, and Enterprise plans include API access for additional custom integrations.",
  },
  {
    question: "Can I review content before it's published?",
    answer:
      "Absolutely. All AI-generated content goes through a review queue before publishing. You can approve, edit, or reject any post. Pro and Enterprise plans also offer a content calendar view where you can preview and rearrange your entire posting schedule before anything goes live.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Security is our top priority. We use AES-256 encryption for all data at rest, TLS 1.3 for data in transit, and SOC 2 Type II compliance. We never share your content or analytics data with third parties. Your social media credentials are stored securely using OAuth 2.0 — we never see your passwords.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, you can cancel your subscription at any time with no penalties or hidden fees. If you cancel a paid plan, you'll continue to have access until the end of your current billing period. Your data is exportable at any time, and we retain it for 30 days after cancellation in case you change your mind.",
  },
  {
    question: "Do you offer team plans?",
    answer:
      "Yes! Our Enterprise plan includes team collaboration features with up to 5 seats included and additional seats available. Team members can have different roles (admin, editor, viewer), share content libraries, and collaborate on campaigns. We also offer custom Enterprise solutions for larger organizations — contact our sales team for details.",
  },
]

export function FAQ() {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = faqs[activeIndex]

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
            FAQ
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            Frequently asked questions
          </h2>
          <p
            className="mt-4 text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            Everything you need to know about SocialNova.
          </p>
        </motion.div>

        {/* Horizontal layout: questions on the left, answer on the right */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Questions list */}
          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => {
              const isActive = i === activeIndex
              return (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className="w-full text-left px-5 py-4 rounded-xl border transition-colors duration-200 group"
                  style={{
                    borderColor: isActive
                      ? "color-mix(in srgb, var(--accent) 50%, transparent)"
                      : "var(--border-default)",
                    backgroundColor: isActive
                      ? "color-mix(in srgb, var(--accent) 8%, transparent)"
                      : "var(--bg-secondary)",
                  }}
                  aria-expanded={isActive}
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight
                      className="h-4 w-4 shrink-0 transition-transform duration-200"
                      style={{
                        color: isActive ? "var(--accent)" : "var(--text-muted)",
                        transform: isActive ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                    />
                    <span
                      className="text-sm md:text-base font-semibold"
                      style={{
                        fontFamily: "var(--font-plus-jakarta)",
                        color: isActive ? "var(--accent)" : "var(--text-primary)",
                      }}
                    >
                      {faq.question}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Answer panel */}
          <div className="lg:sticky lg:top-24 h-fit">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="rounded-xl border p-8"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div
                  className="text-xs font-medium mb-3 uppercase tracking-wider"
                  style={{ color: "var(--accent)" }}
                >
                  Answer
                </div>
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ fontFamily: "var(--font-plus-jakarta)" }}
                >
                  {active.question}
                </h3>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {active.answer}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}