"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Perfect for getting started with AI-powered social media",
    features: [
      "5 posts per month",
      "2 platform connections",
      "Basic AI content suggestions",
      "Standard scheduling",
      "Community support",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For creators and small businesses ready to scale",
    features: [
      "Unlimited posts",
      "6 platform connections",
      "All 12 AI agents",
      "Advanced analytics dashboard",
      "Smart scheduling & optimization",
      "Priority email support",
    ],
    cta: "Get Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/mo",
    description: "For teams and agencies that need full control",
    features: [
      "Everything in Pro",
      "Team collaboration (5 seats)",
      "API access & webhooks",
      "Priority support & SLA",
      "Custom AI agent creation",
      "White-label options",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

export function Pricing() {
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
            Pricing
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            Simple, transparent pricing
          </h2>
          <p
            className="mt-4 text-lg max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Start free. Upgrade when you&apos;re ready. No hidden fees.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-2xl border p-6 lg:p-8 ${
                plan.popular ? "md:scale-105 md:-my-4" : ""
              }`}
              style={{
                backgroundColor: "var(--bg-primary)",
                borderColor: plan.popular
                  ? "var(--accent)"
                  : "var(--border-default)",
                boxShadow: plan.popular
                  ? "0 20px 50px -12px color-mix(in srgb, var(--accent) 25%, transparent)"
                  : "none",
              }}
              variants={cardVariants}
              whileHover={{ y: -4 }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-md text-xs font-bold text-white whitespace-nowrap"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  Most Popular
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <h3
                  className="text-lg font-bold"
                  style={{
                    fontFamily: "var(--font-plus-jakarta)",
                    color: "var(--text-primary)",
                  }}
                >
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mt-3">
                  <span
                    className="text-4xl font-bold"
                    style={{
                      fontFamily: "var(--font-plus-jakarta)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>
                <p
                  className="mt-2 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <Check
                      className="h-4 w-4 mt-0.5 shrink-0"
                      style={{ color: "var(--accent)" }}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href="/signup" className="block">
                <Button
                  className="w-full"
                  variant={plan.popular ? "primary" : "secondary"}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Enterprise note */}
        <motion.p
          className="mt-12 text-center text-sm"
          style={{ color: "var(--text-muted)" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Need a custom plan?{" "}
          <Link
            href="mailto:sales@socialnova.com"
            className="font-medium underline underline-offset-4"
            style={{ color: "var(--accent)" }}
          >
            Talk to our sales team
          </Link>
        </motion.p>
      </div>
    </section>
  )
}
