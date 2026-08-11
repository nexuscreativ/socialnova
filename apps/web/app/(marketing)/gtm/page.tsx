import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Rocket, Target, BarChart3, Calendar, CheckCircle, ArrowRight } from "lucide-react"

const features = [
  {
    icon: Target,
    title: "Market Intelligence",
    description: "AI analyzes competitors, trends, and audience behavior to position your product perfectly.",
  },
  {
    icon: Calendar,
    title: "Launch Planning",
    description: "Automated content calendars, timelines, and coordination across all platforms.",
  },
  {
    icon: BarChart3,
    title: "Performance Tracking",
    description: "Real-time KPI monitoring with AI-powered optimization recommendations.",
  },
  {
    icon: Rocket,
    title: "Multi-Platform Execution",
    description: "Coordinated launches across LinkedIn, Twitter, Instagram, TikTok, and more.",
  },
]

const steps = [
  { step: 1, title: "Define Your Launch", description: "Tell us about your product, audience, and goals" },
  { step: 2, title: "AI Strategy Creation", description: "Our GTM agent creates a comprehensive launch plan" },
  { step: 3, title: "Content Generation", description: "AI generates all launch content for every platform" },
  { step: 4, title: "Automated Execution", description: "Coordinated publishing and campaign management" },
  { step: 5, title: "Optimize & Scale", description: "Real-time performance tracking and optimization" },
]

export default function GTMPage() {
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8"
            style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-secondary)' }}>
            <Rocket className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI-Powered Go-To-Market
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
            Launch Products Like a <span style={{ color: 'var(--accent)' }}>Fortune 500</span>
          </h1>
          
          <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}>
            Our GTM Agent automates your entire product launch strategy—from market research 
            to execution. Just tell us what you're launching, and we'll handle the rest.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-base px-8">
                Start Launch
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="secondary" size="lg" className="text-base px-8">
                See Example Launch
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
              Everything You Need to Launch Successfully
            </h2>
            <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              From research to execution, our GTM agent handles it all.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
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

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
              How It Works
            </h2>
            <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Five simple steps to a successful product launch.
            </p>
          </div>
          
          <div className="space-y-8">
            {steps.map((step) => (
              <div key={step.step} className="flex items-start gap-6">
                <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--accent)' }}>
                  <span className="text-white font-bold">{step.step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
                    {step.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
              Perfect for Any Launch
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "SaaS Products", items: ["Feature launches", "Product updates", "Beta programs"] },
              { title: "Mobile Apps", items: ["App store launches", "Version updates", "User acquisition"] },
              { title: "Brand Campaigns", items: ["Rebranding", "Market expansion", "Awareness campaigns"] },
            ].map((useCase) => (
              <Card key={useCase.title}>
                <CardHeader>
                  <CardTitle>{useCase.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {useCase.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
            Ready to Launch Your Next Product?
          </h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Join companies using AI-powered GTM strategies to dominate their markets.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-base px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="secondary" size="lg" className="text-base px-8">
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
