"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, BookOpen } from "lucide-react"

export default function AdminDocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>API Reference</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Live OpenAPI — same spec as the public <a href="/docs" className="underline" style={{ color: "var(--accent)" }}>/docs</a> (marketing), but framed for operators. Try calls with your bearer token.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: "/api/docs", label: "Swagger UI", desc: "Interactive playground" },
          { href: "/api/redoc", label: "ReDoc", desc: "Searchable reference" },
          { href: "/api/openapi.json", label: "OpenAPI JSON", desc: "Machine-readable schema" },
        ].map(item => (
          <Card key={item.href}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono" style={{ color: "var(--accent)" }}>{item.href}</CardTitle>
              <CardDescription>{item.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <a href={item.href} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">
                  Open <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4" style={{ color: "var(--accent)" }} /> Embedded Swagger</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <iframe src="/api/docs" title="Swagger" className="w-full h-[700px] border-0" style={{ backgroundColor: "var(--bg-primary)" }} />
        </CardContent>
      </Card>
    </div>
  )
}
