"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  User,
  CreditCard,
  Key,
  Bell,
  Shield,
  ArrowRight,
  CheckCircle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StaggerContainer, StaggerItem } from "@/components/engagement/motion"

const sections = [
  {
    title: "Profile",
    description: "Manage your personal information and public profile",
    icon: User,
    href: "/settings/profile",
    color: "var(--color-info)",
    status: "complete",
  },
  {
    title: "Billing",
    description: "View your plan, manage payment methods, and invoices",
    icon: CreditCard,
    href: "/settings/billing",
    color: "var(--color-success)",
    status: "active",
  },
  {
    title: "API Keys",
    description: "Manage API keys for integrations and third-party apps",
    icon: Key,
    href: "/settings/api-keys",
    color: "var(--accent)",
    status: "2 keys",
  },
  {
    title: "Notifications",
    description: "Configure how and when you receive notifications",
    icon: Bell,
    href: "/settings/notifications",
    color: "var(--color-warning)",
    status: "configured",
  },
  {
    title: "Security",
    description: "Password, two-factor authentication, and session management",
    icon: Shield,
    href: "/settings/security",
    color: "var(--color-error)",
    status: "2FA enabled",
  },
]

export default function SettingsPage() {
  return (
    <StaggerContainer className="space-y-3">
      {sections.map(section => (
        <StaggerItem key={section.title}>
          <Link href={section.href}>
            <Card className="transition-all hover:shadow-md cursor-pointer group">
              <CardContent className="flex items-center gap-4 py-0">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `color-mix(in srgb, ${section.color} 15%, transparent)` }}
                >
                  <section.icon className="h-5 w-5" style={{ color: section.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-sm font-semibold"
                    style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
                  >
                    {section.title}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {section.description}
                  </p>
                </div>
                <Badge variant="info" className="shrink-0 hidden sm:inline-flex">
                  {section.status}
                </Badge>
                <ArrowRight
                  className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
                  style={{ color: "var(--text-muted)" }}
                />
              </CardContent>
            </Card>
          </Link>
        </StaggerItem>
      ))}
    </StaggerContainer>
  )
}
