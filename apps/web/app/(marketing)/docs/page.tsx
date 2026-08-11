"use client"
import Link from "next/link"
import { BookOpen, Key, Terminal, Shield, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"


const authExample = `// List your API keys
curl -X GET https://api.socialnova.app/users/me/api-keys \\
  -H "Authorization: Bearer \${SOCIALNOVA_API_KEY}"
`

const chatExample = `// Send a message to the social media assistant
curl -X POST https://api.socialnova.app/api/v1/chat/chat \\
  -H "Authorization: Bearer \${SOCIALNOVA_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Draft a LinkedIn post about our launch"}'`

const quickStarts = [
  {
    icon: Key,
    title: "1. Create an API key",
    description: "Generate a key from Settings → API Keys. Keys are shown only once at creation.",
  },
  {
    icon: Terminal,
    title: "2. Call the API",
    description: "Send requests with an Authorization: Bearer header pointing to your key.",
  },
  {
    icon: Globe,
    title: "3. Use server-side only",
    description: "Never expose keys in browser code. Route calls through your own backend.",
  },
]

export default function DocsPage() {
  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-secondary)" }}
          >
            <BookOpen className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              SocialNova API Reference
            </span>
          </div>

          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            Build on the <span style={{ color: "var(--accent)" }}>SocialNova API</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Automate content, campaigns, and AI agents with our REST API. Interactive reference,
            example requests, and real usage tracking — all in one place.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-base px-8">
                Get an API Key
              </Button>
            </Link>
            <a href="#reference">
              <Button variant="secondary" size="lg" className="text-base px-8">
                <BookOpen className="h-4 w-4 mr-2" />
                Open the Reference
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Quickstart */}
      <section className="py-24" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              Get started in three steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {quickStarts.map(item => (
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4" style={{ color: "var(--accent)" }} />
                <span className="text-sm font-medium" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                  Authenticate
                </span>
              </div>
              <pre
                className="p-4 rounded-lg text-xs leading-relaxed overflow-x-auto"
                style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
              >
                {authExample}
              </pre>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="h-4 w-4" style={{ color: "var(--accent)" }} />
                <span className="text-sm font-medium" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                  First request
                </span>
              </div>
              <pre
                className="p-4 rounded-lg text-xs leading-relaxed overflow-x-auto"
                style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
              >
                {chatExample}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive reference */}
      <section id="reference" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              Interactive API Reference
            </h2>
            <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Explore every endpoint, inspect the OpenAPI schema, or try requests with your API key.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                href: "/api/docs",
                label: "Swagger UI",
                desc: "Interactive playground with try-it-out calls and Bearer auth.",
              },
              {
                href: "/api/redoc",
                label: "ReDoc",
                desc: "Clean, searchable reference layout for browsing all routes.",
              },
              {
                href: "/api/openapi.json",
                label: "OpenAPI JSON",
                desc: "Machine-readable OpenAPI 3.1 schema for client generation.",
              },
            ].map(item => (
              <div
                key={item.href}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl border"
                style={{ borderColor: "var(--border-default)" }}
              >
                <div>
                  <p className="text-sm font-mono" style={{ color: "var(--accent)" }}>{item.href}</p>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                </div>
                <a href={item.href} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm">Open</Button>
                </a>
              </div>
            ))}

            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-default)" }}>
              <div
                className="px-4 py-3 text-sm font-medium"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                Embedded Swagger UI
              </div>
              <iframe
                src="/api/docs"
                title="SocialNova API Swagger UI"
                className="w-full h-[700px]"
                style={{ backgroundColor: "var(--bg-primary)" }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}