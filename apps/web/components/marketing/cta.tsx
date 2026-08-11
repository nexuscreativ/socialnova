import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section className="py-24" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2
          className="text-3xl md:text-4xl font-bold"
          style={{ fontFamily: 'var(--font-plus-jakarta)' }}
        >
          Make social media pay
        </h2>
        <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Turn attention into real business results with SocialNova.
          Start free today — no credit card required.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="text-base px-8">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="mailto:hello@socialnova.com">
            <Button variant="secondary" size="lg" className="text-base px-8">
              Talk to us
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
