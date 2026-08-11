"use client"
import { useRef, useState } from "react"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatMessage } from "@/components/chat/chat-message"
import { ChatTemplates } from "@/components/engagement/chat-templates"
import { FadeIn } from "@/components/engagement/motion"
import { Bot, Sparkles } from "lucide-react"

export default function ChatPage() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [loading, setLoading] = useState(false)
  const [showTemplates, setShowTemplates] = useState(true)

  // Keep the conversation id across turns so Nova has memory of this thread.
  const conversationIdRef = useRef<string | null>(null)

  const handleSend = async (content: string) => {
    setMessages(prev => [...prev, { role: "user", content }])
    setShowTemplates(false)
    setLoading(true)

    try {
      const response = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversation_id: conversationIdRef.current,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error ?? "Chat request failed")
      }

      conversationIdRef.current = data.conversation_id ?? conversationIdRef.current
      setMessages(prev => [...prev, { role: "assistant", content: data.response }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (prompt: string) => {
    handleSend(prompt)
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {messages.length === 0 && showTemplates && (
        <FadeIn>
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center max-w-2xl mx-auto px-4">
              <div className="h-20 w-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                <Bot className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
                Hi, I&apos;m Nova 👋
              </h2>
              <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                Your AI co-pilot for social media management. Ask me anything or pick a template below.
              </p>

              <ChatTemplates onSelect={handleTemplateSelect} />

              <div className="mt-6 flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Sparkles className="h-3 w-3" />
                <span>Powered by 12 specialized AI agents</span>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {(messages.length > 0 || !showTemplates) && (
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[var(--accent)]">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-[var(--bg-tertiary)] rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  )
}