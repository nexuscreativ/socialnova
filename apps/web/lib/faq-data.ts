export interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
  keywords: string[]
  followUp?: string[]
}

export const faqData: FAQItem[] = [
  // Pricing
  {
    id: "pricing-1",
    category: "Pricing",
    question: "What are your pricing plans?",
    answer: "We offer 4 pricing tiers:\n• Free: $0/mo - 10 AI credits, unlimited projects\n• Starter: $25/mo - 100 credits, 1 live project, 5% ad fee\n• Scale: $150/mo - 1,000 credits, 5 projects, 2% ad fee\n• Agency: $250/mo - Unlimited credits with BYOK, 2% ad fee",
    keywords: ["pricing", "cost", "plans", "price", "how much"],
    followUp: ["What's included in the free plan?", "Can I upgrade later?"],
  },
  {
    id: "pricing-2",
    category: "Pricing",
    question: "Is there a free trial?",
    answer: "Yes! Our Free plan is free forever with 10 AI credits per month. No credit card required to get started. You can upgrade anytime as your needs grow.",
    keywords: ["free", "trial", "test", "demo"],
  },
  {
    id: "pricing-3",
    category: "Pricing",
    question: "What are AI credits?",
    answer: "AI credits are used when our AI agents perform tasks like generating content, analyzing data, or creating strategies. Different tasks use different amounts of credits. Free plan includes 10/month, paid plans include more.",
    keywords: ["credits", "ai credits", "usage"],
  },

  // Features
  {
    id: "features-1",
    category: "Features",
    question: "What AI agents do you have?",
    answer: "We have 12 specialized AI agents:\n• Nova (Orchestrator) - Coordinates all agents\n• Creator - Content generation\n• Timing - Optimal posting times\n• Growth - Ad optimization\n• Connector - CRM & lead management\n• Guardian - Quality control\n• GTM - Go-to-market strategies\n• MarketResearch - Market analysis\n• LaunchCoordinator - Execution coordination\n• Support - Community responses\n• Escalation - Crisis & reputation management\n• Voice - Audio content generation",
    keywords: ["agents", "ai", "features", "what can"],
  },
  {
    id: "features-2",
    category: "Features",
    question: "What platforms do you support?",
    answer: "We support 14 social media platforms:\n• LinkedIn, Instagram, Twitter/X, TikTok\n• Facebook, YouTube, Pinterest\n• Reddit, Quora, Medium\n• And more being added regularly",
    keywords: ["platforms", "supported", "integrations"],
  },
  {
    id: "features-3",
    category: "Features",
    question: "What is the Agent Factory?",
    answer: "The Agent Factory lets you create custom AI agents from templates. No coding required - just describe what you need, and we'll generate a specialized agent for your specific use case.",
    keywords: ["agent factory", "custom agent", "create"],
  },

  // GTM
  {
    id: "gtm-1",
    category: "GTM",
    question: "What is the GTM Agent?",
    answer: "Our GTM (Go-To-Market) Agent creates complete launch strategies for your products. It handles market research, competitor analysis, content planning, and multi-platform coordination.",
    keywords: ["gtm", "launch", "go to market", "strategy"],
  },
  {
    id: "gtm-2",
    category: "GTM",
    question: "How does the GTM pipeline work?",
    answer: "The GTM pipeline works in 5 steps:\n1. Define your product and audience\n2. AI creates a comprehensive strategy\n3. Content is generated for all platforms\n4. Coordinated launch across channels\n5. Real-time tracking and optimization",
    keywords: ["gtm pipeline", "launch process", "how it works"],
  },

  // Technical
  {
    id: "tech-1",
    category: "Technical",
    question: "Do I need coding skills?",
    answer: "No! SocialNova is designed for marketers and business owners. Our AI agents handle all the technical work. You just chat with Nova and tell her what you need.",
    keywords: ["coding", "technical", "skills", "programming"],
  },
  {
    id: "tech-2",
    category: "Technical",
    question: "Is my data secure?",
    answer: "Yes! We use enterprise-grade security:\n• End-to-end encryption\n• SOC 2 compliance\n• GDPR compliant\n• Data never shared with third parties\n• You can delete your data anytime",
    keywords: ["security", "data", "privacy", "safe"],
  },

  // Support
  {
    id: "support-1",
    category: "Support",
    question: "How can I get help?",
    answer: "You can get help through:\n• This chat (AI + human agents)\n• WhatsApp support\n• Telegram support\n• Voice calls\n• Email: support@socialnova.com\n• Help Center: help.socialnova.com",
    keywords: ["help", "support", "contact", "assistance"],
  },
  {
    id: "support-2",
    category: "Support",
    question: "What are your support hours?",
    answer: "Our AI support is available 24/7. Human support hours are:\n• Monday-Friday: 9am-6pm EST\n• Saturday: 10am-2pm EST\n• Emergency support available for Scale and Agency plans",
    keywords: ["hours", "availability", "when"],
  },
]

export function searchFAQ(query: string): FAQItem[] {
  const lowerQuery = query.toLowerCase()
  return faqData.filter(
    (item) =>
      item.keywords.some((keyword) => lowerQuery.includes(keyword)) ||
      item.question.toLowerCase().includes(lowerQuery) ||
      item.answer.toLowerCase().includes(lowerQuery)
  )
}

export function getFAQByCategory(category: string): FAQItem[] {
  return faqData.filter((item) => item.category === category)
}

export function getFAQCategories(): string[] {
  return [...new Set(faqData.map((item) => item.category))]
}
