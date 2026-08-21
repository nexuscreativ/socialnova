import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SectionStubProps {
  title: string
  description: string
  milestone: string
}

export function AdminSectionStub({ title, description, milestone }: SectionStubProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
          >
            {title}
          </h1>
          <Badge variant="warning">{milestone}</Badge>
        </div>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      </div>
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            This section is scheduled for the {milestone} milestone. The core admin
            console on the Overview tab remains the source of truth until then.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
