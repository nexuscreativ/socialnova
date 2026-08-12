"use client"
import { useState } from "react"
import { MessageSquare, AtSign, Heart, Repeat2, Search, Inbox, Send, Check, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Tabs, TabPanel } from "@/components/ui/tabs"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"

interface Message {
  id: string
  handle: string
  name: string | null
  platform: "Twitter" | "Instagram" | "TikTok" | "LinkedIn"
  preview: string
  time: string
  unread: boolean
  type: "dm" | "comment" | "mention" | "like" | "repost"
}

const initialMessages: Message[] = [
  { id: "1", handle: "@sarah_creates", name: "Sarah Kim", platform: "Instagram", preview: "Loved your latest post! Can we collaborate on a giveaway?", time: "2m", unread: true, type: "dm" },
  { id: "2", handle: "@dave_co", name: "Dave Chen", platform: "Twitter", preview: "That thread on content strategy was 🔥 saving it for later", time: "18m", unread: true, type: "mention" },
  { id: "3", handle: "@maria_dev", name: "Maria Lopez", platform: "LinkedIn", preview: "Would you be open to a quick chat about agency partnerships?", time: "1h", unread: true, type: "dm" },
  { id: "4", handle: "@tiktokfan99", name: null, platform: "TikTok", preview: "How did you film the behind-the-scenes part?", time: "3h", unread: false, type: "comment" },
  { id: "5", handle: "@brandwatch", name: null, platform: "Twitter", preview: "liked your post", time: "5h", unread: false, type: "like" },
  { id: "6", handle: "@socialinsider", name: null, platform: "LinkedIn", preview: "reposted your article", time: "8h", unread: false, type: "repost" },
]

const typeBadge: Record<Message["type"], { label: string; icon: typeof MessageSquare; variant: "default" | "info" | "success" | "warning" }> = {
  dm: { label: "DM", icon: Send, variant: "info" },
  comment: { label: "Comment", icon: MessageSquare, variant: "default" },
  mention: { label: "Mention", icon: AtSign, variant: "warning" },
  like: { label: "Like", icon: Heart, variant: "success" },
  repost: { label: "Repost", icon: Repeat2, variant: "info" },
}

export default function InboxPage() {
  const [messages, setMessages] = useState(initialMessages)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("all")

  const filtered = messages.filter(m => {
    if (tab === "unread" && !m.unread) return false
    if (tab === "dm" && m.type !== "dm") return false
    if (search && !`${m.name ?? ""} ${m.handle} ${m.preview}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const markRead = (id: string) =>
    setMessages(ms => ms.map(m => (m.id === id ? { ...m, unread: false } : m)))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}>
            Inbox
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            DMs, comments, and mentions from across your social profiles
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
          <Input
            placeholder="Search inbox..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs
            value={tab}
            onValueChange={setTab}
            tabs={[
              { value: "all", label: "All", icon: <Inbox className="h-4 w-4" /> },
              { value: "unread", label: `Unread (${messages.filter(m => m.unread).length})`, icon: <MessageSquare className="h-4 w-4" /> },
              { value: "dm", label: "Direct messages", icon: <Send className="h-4 w-4" /> },
            ]}
            className="px-6 pt-2"
          >
            <TabPanel value="all" activeTab={tab} className="mt-0">
              <div className="divide-y" style={{ borderColor: "var(--border-default)" }}>
                {filtered.map((m, i) => {
                  const badge = typeBadge[m.type]
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-3 px-6 py-4 hover:bg-[var(--bg-tertiary)]/50 transition-colors cursor-pointer"
                      onClick={() => markRead(m.id)}
                    >
                      <Avatar fallback={(m.name ?? m.handle).charAt(1)?.toUpperCase() || "U"} alt={m.name ?? m.handle} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                            {m.name ?? m.handle}
                          </span>
                          {m.name && <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>{m.handle}</span>}
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                        <p className="text-sm mt-0.5 truncate" style={{ color: m.unread ? "var(--text-primary)" : "var(--text-secondary)" }}>
                          {m.preview}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{m.time}</span>
                        {m.unread && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} />}
                        <DropdownMenu
                          items={[
                            { label: m.unread ? "Mark as read" : "Mark as unread", icon: <Check className="h-3.5 w-3.5" />, onClick: () => markRead(m.id) },
                            { label: "Reply", icon: <Send className="h-3.5 w-3.5" /> },
                            { label: "Archive", icon: <MoreVertical className="h-3.5 w-3.5" /> },
                          ]}
                        />
                      </div>
                    </motion.div>
                  )
                })}
                {filtered.length === 0 && (
                  <div className="py-16 text-center">
                    <Inbox className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No messages found.</p>
                  </div>
                )}
              </div>
            </TabPanel>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
