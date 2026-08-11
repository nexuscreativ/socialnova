"use client"
import { useState } from "react"
import { Send, Paperclip, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-4" style={{ borderColor: 'var(--border-default)' }}>
      <div className="flex items-end gap-2">
        <Button type="button" variant="ghost" size="icon" className="shrink-0">
          <Paperclip className="h-5 w-5" />
        </Button>
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder="Ask Nova anything..."
            rows={1}
            className="w-full resize-none rounded-xl border bg-[var(--bg-secondary)] px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
            disabled={disabled}
          />
        </div>
        <Button type="button" variant="ghost" size="icon" className="shrink-0">
          <Mic className="h-5 w-5" />
        </Button>
        <Button
          type="submit"
          size="icon"
          className="shrink-0 rounded-xl"
          disabled={!message.trim() || disabled}
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Send className="h-5 w-5 text-white" />
        </Button>
      </div>
    </form>
  )
}
