"use client"
import { Bot, User } from "lucide-react"

interface ChatMessageProps {
  message: {
    role: "user" | "assistant"
    content: string
  }
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant"

  return (
    <div className={`flex gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}>
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
          isAssistant ? "bg-[var(--accent)]" : "bg-[var(--color-neutral-600)]"
        }`}
      >
        {isAssistant ? (
          <Bot className="h-4 w-4 text-white" />
        ) : (
          <User className="h-4 w-4 text-white" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          isAssistant
            ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
            : "bg-[var(--accent)] text-white"
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
