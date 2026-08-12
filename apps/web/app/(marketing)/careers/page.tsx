import Link from "next/link"
import { Briefcase, Rocket, Heart, Lightbulb, Users, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

const openings = [
  {
    title: "Senior Full-Stack Engineer",
    dept: "Engineering",
    location: "Remote (US/EU)",
    type: "Full-time",
  },
  {
    title: "AI Agent Platform Engineer",
    dept: "Engineering",
    location: "Remote (US/EU)",
    type: "Full-time",
  },
  {
    title: "Product Designer",
    dept: "Design",
    location: "Remote (US/EU)",
    type: "Full-time",
  },
  {
    title: "Developer Advocate",
    dept: "Growth",
    location: "Remote (Global)",
    type: "Full-time",
  },
]

const values = [
  { icon: Rocket, title: "Ship fast", description: "We move quickly and iterate on real feedback from creators." },
  { icon: Lightbulb, title: "Stay curious", description: "AI changes weekly — we learn in public and share constantly." },
  { icon: Users, title: "Craft matters", description: "We sweat the details so our users don't have to." },
  { icon: Heart, title: "Care deeply", description: "We build for people who pour their heart into their content." },
]

export default function CareersPage() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-secondary)" }}
          >
            <Briefcase className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Join the team
            </span>
          </div>

          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            Build the future of <span style={{ color: "var(--accent)" }}>social media</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            SocialNova helps creators and brands run their entire social presence with AI.
            We&apos;re hiring people who want to build tools that feel magical.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#openings">
              <Button size="lg" className="text-base px-8">
                View open roles
              </Button>
            </a>
            <Link href="/contact">
              <Button variant="secondary" size="lg" className="text-base px-8">
                Get in touch
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              What we believe
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(item => (
              <div
                key={item.title}
                className="p-6 rounded-xl border"
                style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-primary)" }}
              >
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}
                >
                  <item.icon className="h-6 w-6" style={{ color: "var(--accent)" }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                  {item.title}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Openings */}
      <section id="openings" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              Open positions
            </h2>
            <p className="mt-4 text-lg" style={{ color: "var(--text-secondary)" }}>
              {openings.length} roles across engineering, design, and growth
            </p>
          </div>

          <div className="space-y-4">
            {openings.map(role => (
              <div
                key={role.title}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl border"
                style={{ borderColor: "var(--border-default)" }}
              >
                <div>
                  <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    {role.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {role.dept}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      {role.location}
                    </span>
                    <span>{role.type}</span>
                  </div>
                </div>
                <Link href="/contact">
                  <Button variant="secondary" size="sm">Apply</Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              Don&apos;t see a role that fits? We always love meeting great people.
            </p>
            <Link href="/contact">
              <Button>Tell us about yourself</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}