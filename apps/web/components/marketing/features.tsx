import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Calendar, BarChart3, MessageSquare, Shield, Zap } from "lucide-react"

const features = [
  {
    icon: Bot,
    title: "12 AI Agents",
    description: "Specialized agents for content, scheduling, ads, CRM, analytics, and more.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "AI determines optimal posting times for each platform and audience.",
  },
  {
    icon: BarChart3,
    title: "Revenue Attribution",
    description: "Track which posts drive DMs, leads, and actual revenue.",
  },
  {
    icon: MessageSquare,
    title: "Social CRM",
    description: "Unified inbox with lead scoring and automated follow-ups.",
  },
  {
    icon: Shield,
    title: "Brand Guardian",
    description: "Automated quality checks ensure consistent brand voice.",
  },
  {
    icon: Zap,
    title: "Agent Factory",
    description: "Create custom agents from templates in minutes, not months.",
  },
]

export function Features() {
  return (
    <section className="py-24" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: 'var(--font-plus-jakarta)' }}
          >
            Everything you need to dominate social media
          </h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            One platform, one chat interface, 14 platforms. No more juggling tools.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
                >
                  <feature.icon className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p style={{ color: 'var(--text-secondary)' }}>{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
