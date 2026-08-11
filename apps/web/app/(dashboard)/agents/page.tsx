"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, TrendingUp, Calendar, MessageSquare, Shield, BarChart3, Users, Target, Rocket, Headphones, AlertTriangle, Mic } from "lucide-react"

const agents = [
  {
    name: "Nova (Orchestrator)",
    description: "Coordinates all agents and decomposes complex tasks",
    tier: "premium",
    status: "active",
    icon: Bot,
    color: "var(--accent)",
  },
  {
    name: "Creator",
    description: "Generates content for all social platforms",
    tier: "free",
    status: "active",
    icon: MessageSquare,
    color: "var(--color-success)",
  },
  {
    name: "Timing",
    description: "Determines optimal posting times",
    tier: "free",
    status: "active",
    icon: Calendar,
    color: "var(--color-info)",
  },
  {
    name: "Growth",
    description: "Optimizes paid advertising campaigns",
    tier: "mid",
    status: "active",
    icon: TrendingUp,
    color: "var(--color-warning)",
  },
  {
    name: "Connector",
    description: "Manages CRM and lead interactions",
    tier: "free",
    status: "active",
    icon: Users,
    color: "var(--color-info)",
  },
  {
    name: "Guardian",
    description: "Ensures content quality and brand consistency",
    tier: "free",
    status: "active",
    icon: Shield,
    color: "var(--color-success)",
  },
  {
    name: "GTM",
    description: "Creates go-to-market strategies for launches",
    tier: "premium",
    status: "new",
    icon: Rocket,
    color: "var(--accent)",
  },
  {
    name: "MarketResearch",
    description: "Conducts market research and competitor analysis",
    tier: "mid",
    status: "active",
    icon: BarChart3,
    color: "var(--color-warning)",
  },
  {
    name: "LaunchCoordinator",
    description: "Coordinates multi-platform launch execution",
    tier: "mid",
    status: "active",
    icon: Target,
    color: "var(--color-info)",
  },
  {
    name: "Support",
    description: "Responds to DMs, comments, and mentions with on-brand replies",
    tier: "free",
    status: "active",
    icon: Headphones,
    color: "var(--color-info)",
  },
  {
    name: "Escalation",
    description: "Detects crises early and manages reputation events",
    tier: "mid",
    status: "active",
    icon: AlertTriangle,
    color: "var(--color-error)",
  },
  {
    name: "Voice",
    description: "Generates voiceovers and audio content for multi-format publishing",
    tier: "mid",
    status: "active",
    icon: Mic,
    color: "var(--color-warning)",
  },
]

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
          AI Agents
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          12 specialized agents working together to manage your social media.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card key={agent.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${agent.color}20` }}
                  >
                    <agent.icon className="h-5 w-5" style={{ color: agent.color }} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: agent.tier === "premium" ? "var(--accent)" : "var(--bg-tertiary)",
                        color: agent.tier === "premium" ? "white" : "var(--text-secondary)",
                      }}
                    >
                      {agent.tier}
                    </span>
                  </div>
                </div>
                {agent.status === "new" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500 text-white">
                    NEW
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {agent.description}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1">
                  Configure
                </Button>
                <Button size="sm" className="flex-1">
                  Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>GTM Agent - Launch Strategy Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Admin Process</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Auto-generate GTM strategies for SocialNova's own feature launches.
                Competitor analysis, messaging, and campaign planning.
              </p>
              <Button size="sm">Auto-Generate Strategy</Button>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Customer Service</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Create custom GTM strategies for client product launches.
                Full service: research → strategy → execution → tracking.
              </p>
              <Button size="sm">Create Client Strategy</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
