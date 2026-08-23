export interface PricingTier {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  popular: boolean
}

export const PRICING_TIERS: PricingTier[] = [
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

export const PRICING_BY_NAME: Record<string, PricingTier> = Object.fromEntries(
  PRICING_TIERS.map(t => [t.name, t]),
)
