"use client"
import { useEffect, useRef, useState } from "react"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatMessage as ChatMessageView } from "@/components/chat/chat-message"
import { ChatTemplates } from "@/components/engagement/chat-templates"
import { FadeIn } from "@/components/engagement/motion"
import { Bot, Sparkles, Plus, Trash2, MessageSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatTurn { role: "user" | "assistant"; content: string }
interface ConversationMeta { conversation_id: string; last_message: string; updated_at: string | null; message_count: number; last_role?: string | null }

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatTurn[]>([])
  const [loading, setLoading] = useState(false)
  const [showTemplates, setShowTemplates] = useState(true)
  const [conversations, setConversations] = useState<ConversationMeta[]>([])
  const [loadingConvos, setLoadingConvos] = useState(false)
  const conversationIdRef = useRef<string | null>(null)

  const loadConversations = async () => {
    setLoadingConvos(true)
    try {
      const res = await fetch("/api/v1/conversations", { cache: "no-store" })
      const data = await res.json().catch(() => null)
      if (res.ok) setConversations(data.conversations ?? [])
    } catch { /* ignore */ } finally { setLoadingConvos(false) }
  }
  useEffect(() => { loadConversations() }, [])

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/conversations/${encodeURIComponent(id)}`, { cache: "no-store" })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? "Failed to load")
      conversationIdRef.current = data.conversation_id ?? id
      setMessages((data.messages ?? []).map((m: { role: string; content: string }) => ({ role: m.role as ChatTurn["role"], content: m.content })))
      setShowTemplates(false)
    } catch (e) {
      console.error(e)
    }
  }
  const deleteConversation = async (id: string) => {
    try {
      await fetch(`/api/v1/conversations/${encodeURIComponent(id)}`, { method: "DELETE" })
      if (conversationIdRef.current === id) {
        conversationIdRef.current = null
        setMessages([])
        setShowTemplates(true)
      }
      loadConversations()
    } catch { /* ignore */ }
  }
  const newChat = () => {
    conversationIdRef.current = null
    setMessages([])
    setShowTemplates(true)
  }

  const handleSend = async (content: string) => {
    setMessages(prev => [...prev, { role: "user", content }])
    setShowTemplates(false)
    setLoading(true)
    const placeholderIdx = messages.length + 1
    setMessages(prev => [...prev, { role: "assistant", content: "" }])

    const tryStream = async (): Promise<boolean> => {
      try {
        const res = await fetch("/api/v1/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, conversation_id: conversationIdRef.current }),
        })
        if (!res.ok || !res.body) return false
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let acc = ""
        let buffer = ""
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split("\n\n")
          buffer = parts.pop() ?? ""
          for (const part of parts) {
            const line = part.trim()
            if (!line.startsWith("data:")) continue
            const payload = JSON.parse(line.slice(5).trim())
            if (payload.token) {
              acc += payload.token
              setMessages(prev => prev.map((m, i) => (i === placeholderIdx && m.role === "assistant" ? { ...m, content: acc } : m)))
            }
            if (payload.done) {
              conversationIdRef.current = payload.conversation_id ?? conversationIdRef.current
            }
          }
        }
        // flush remaining buffer
        if (buffer.trim().startsWith("data:")) {
          try {
            const payload = JSON.parse(buffer.trim().slice(5).trim())
            if (payload.token) {
              acc += payload.token
              setMessages(prev => prev.map((m, i) => (i === placeholderIdx && m.role === "assistant" ? { ...m, content: acc } : m)))
            }
            if (payload.done) conversationIdRef.current = payload.conversation_id ?? conversationIdRef.current
          } catch { /* ignore */ }
        }
        if (!acc) return false
        loadConversations()
        return true
      } catch {
        return false
      }
    }

    const streamed = await tryStream()
    if (!streamed) {
      // fallback to non-streaming
      try {
        const res = await fetch("/api/v1/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, conversation_id: conversationIdRef.current }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error ?? "Chat failed")
        conversationIdRef.current = data.conversation_id ?? conversationIdRef.current
        const response = data.response ?? ""
        setMessages(prev => prev.map((m, i) => (i === placeholderIdx && m.role === "assistant" ? { ...m, content: response } : m)))
        loadConversations()
      } catch {
        setMessages(prev => prev.map((m, i) => (i === placeholderIdx && m.role === "assistant" ? { ...m, content: "Sorry, I encountered an error. Please try again." } : m)))
      }
    }
    setLoading(false)
  }

  const handleTemplateSelect = (prompt: string) => handleSend(prompt)

  return (
    <div className="flex h-full max-w-6xl mx-auto gap-4">
      {/* Conversations sidebar */}
      <div className="hidden md:flex w-64 shrink-0 flex-col rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-default)", background: "var(--bg-secondary)" }}>
        <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border-default)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Conversations</span>
          <Button variant="ghost" size="sm" onClick={newChat} aria-label="New chat"><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConvos ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--text-muted)" }} /></div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: "var(--text-muted)" }}>No conversations yet</p>
          ) : (
            conversations.map(c => (
              <div
                key={c.conversation_id}
                className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-[var(--bg-tertiary)] cursor-pointer"
                style={{ background: conversationIdRef.current === c.conversation_id ? "var(--bg-tertiary)" : undefined }}
                onClick={() => loadConversation(c.conversation_id)}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: "var(--text-primary)" }}>{c.last_message || "New conversation"}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{c.message_count} msgs · {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : "—"}</p>
                </div>
                <button
                  aria-label="Delete conversation"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--bg-secondary)]"
                  onClick={e => {
                    e.stopPropagation()
                    deleteConversation(c.conversation_id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" style={{ color: "var(--color-error)" }} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex flex-col flex-1 min-w-0 rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-default)", background: "var(--bg-primary)" }}>
        {messages.length === 0 && showTemplates ? (
          <FadeIn>
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center max-w-2xl mx-auto px-4">
                <div className="h-20 w-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: "var(--accent)" }}>
                  <Bot className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-plus-jakarta)" }}>Hi, I&apos;m Nova 👋</h2>
                <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>Your AI co-pilot for social media management. Ask me anything or pick a template below.</p>
                <ChatTemplates onSelect={handleTemplateSelect} />
                <div className="mt-6 flex items-center justify-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Sparkles className="h-3 w-3" /><span>Powered by 12 specialized AI agents · streaming enabled</span>
                </div>
              </div>
            </div>
          </FadeIn>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 p-4">
            {messages.map((msg, i) => (
              <ChatMessageView key={i} message={msg} />
            ))}
            {loading && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[var(--accent)]"><Bot className="h-4 w-4 text-white" /></div>
                <div className="bg-[var(--bg-tertiary)] rounded-2xl px-4 py-3"><div className="flex gap-1"><span className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "0ms" }} /><span className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "150ms" }} /><span className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "300ms" }} /></div></div>
              </div>
            )}
          </div>
        )}
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  )
}
