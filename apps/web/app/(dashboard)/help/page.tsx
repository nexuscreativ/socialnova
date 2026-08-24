import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, BookOpen, MessageSquare, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function HelpPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
          <HelpCircle className="h-6 w-6" style={{ color: "var(--accent)" }} /> Help
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Guides, docs, and support.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" style={{ color: "var(--accent)" }} /> Docs</CardTitle>
            <CardDescription>API reference and guides</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link href="/docs"><Button variant="secondary" size="sm">Marketing docs</Button></Link>
            <Link href="/admin/docs"><Button variant="ghost" size="sm">Admin API docs <ExternalLink className="h-3 w-3 ml-1" /></Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" style={{ color: "var(--accent)" }} /> Support</CardTitle>
            <CardDescription>Chat with Nova or open the bubble</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Use the chat bubble (bottom-right) or head to <Link href="/chat" className="underline" style={{ color: "var(--accent)" }}>/chat</Link> for streaming + history.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
