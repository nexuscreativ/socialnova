import { Hero } from "@/components/marketing/hero"
import { SocialProof } from "@/components/marketing/social-proof"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { AgentsGrid } from "@/components/marketing/agents-grid"
import { Integrations } from "@/components/marketing/integrations"
import { Stats } from "@/components/marketing/stats"
import { Testimonials } from "@/components/marketing/testimonials"
import { Pricing } from "@/components/marketing/pricing"
import { FAQ } from "@/components/marketing/faq"
import { FinalCTA } from "@/components/marketing/final-cta"

export default function LandingPage() {
  return (
    <>
      <Hero />
      <SocialProof />
      <HowItWorks />
      <AgentsGrid />
      <Integrations />
      <Stats />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  )
}
