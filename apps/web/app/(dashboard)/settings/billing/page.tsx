"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { CreditCard, Download, ExternalLink, Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    features: ["5 social platforms", "3 AI agents", "100 posts/mo", "Basic analytics"],
    current: false,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/month",
    features: ["14 social platforms", "12 AI agents", "Unlimited posts", "Advanced analytics", "Priority support"],
    current: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    features: ["Everything in Pro", "Custom AI training", "White-label", "Dedicated support", "SLA guarantee"],
    current: false,
  },
]

const invoices = [
  { id: "INV-2026-07", date: "Jul 1, 2026", amount: "$79.00", status: "paid" },
  { id: "INV-2026-06", date: "Jun 1, 2026", amount: "$79.00", status: "paid" },
  { id: "INV-2026-05", date: "May 1, 2026", amount: "$79.00", status: "paid" },
]

export default function BillingPage() {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>You&apos;re on the Pro plan, renewing on Aug 1, 2026</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--accent)" }}>$79</span>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>/month</span>
            <Badge variant="success">Active</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm">
              <CreditCard className="h-4 w-4 mr-1.5" />
              Update payment method
            </Button>
            <Button variant="ghost" size="sm" className="text-[var(--color-error)]">
              Cancel subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}>
          Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <Card
              key={plan.name}
              className={plan.current ? "ring-2" : ""}
              style={plan.current ? { borderColor: "var(--accent)" } : {}}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.current && <Badge>Current</Badge>}
                </div>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>{plan.price}</span>
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--color-success)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>{feature}</span>
                    </li>
                  ))}
                </ul>
                {!plan.current && (
                  <Button variant="secondary" className="w-full" size="sm">
                    {plan.price > "$79" ? "Upgrade" : "Downgrade"}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Download your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.map(invoice => (
              <div
                key={invoice.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
                style={{ borderColor: "var(--border-default)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{invoice.id}</span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{invoice.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{invoice.amount}</span>
                  <Button variant="ghost" size="sm">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
