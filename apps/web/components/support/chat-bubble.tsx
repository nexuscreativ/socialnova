"use client"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MessageSquare,
  X,
  Send,
  Mic,
  MicOff,
  Phone,
  Video,
  MoreVertical,
  Bot,
  User,
  Headphones,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  type?: "text" | "faq" | "escalation" | "gtm"
}

interface ChatBubbleProps {
  position?: "bottom-right" | "bottom-left"
  primaryColor?: string
}

export function SupportChatBubble({
  position = "bottom-right",
  primaryColor = "var(--accent)",
}: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm Nova, your AI support assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showEscalation, setShowEscalation] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<"whatsapp" | "telegram" | "voice" | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const quickActions = [
    { label: "FAQ", icon: MessageSquare, action: "faq" },
    { label: "GTM Help", icon: Sparkles, action: "gtm" },
    { label: "Talk to Human", icon: User, action: "escalate" },
    { label: "Voice Chat", icon: Headphones, action: "voice" },
  ]

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const response = generateAIResponse(input)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        type: response.type,
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)

      if (response.needsEscalation) {
        setShowEscalation(true)
      }
    }, 1500)
  }

  const generateAIResponse = (query: string): { content: string; type?: "text" | "faq" | "escalation" | "gtm"; needsEscalation?: boolean } => {
    const lowerQuery = query.toLowerCase()

    // FAQ responses
    if (lowerQuery.includes("pricing") || lowerQuery.includes("cost")) {
      return {
        content: "We offer 4 pricing tiers:\n• Free: $0/mo - 10 AI credits\n• Starter: $25/mo - 100 credits\n• Scale: $150/mo - 1,000 credits\n• Agency: $250/mo - Unlimited with BYOK\n\nWould you like to start a free trial?",
        type: "faq",
      }
    }

    if (lowerQuery.includes("gtm") || lowerQuery.includes("launch")) {
      return {
        content: "Our GTM Agent can help you create a complete launch strategy! It includes:\n• Market research & competitor analysis\n• Content calendar creation\n• Multi-platform coordination\n• Performance tracking\n\nWould you like me to start generating a GTM strategy for your product?",
        type: "gtm",
      }
    }

    if (lowerQuery.includes("agent") || lowerQuery.includes("ai")) {
      return {
        content: "We have 12 specialized AI agents:\n• Nova (Orchestrator) - Coordinates everything\n• Creator - Content generation\n• Timing - Optimal posting\n• Growth - Ad optimization\n• Connector - CRM & leads\n• Guardian - Quality control\n• GTM - Launch strategies\n• MarketResearch - Market analysis\n• LaunchCoordinator - Execution\n• Support - Community management\n• Escalation - Crisis resolution\n• Voice - Audio content\n\nEach agent can be configured for your specific needs.",
        type: "faq",
      }
    }

    if (lowerQuery.includes("help") || lowerQuery.includes("support")) {
      return {
        content: "I can help you with:\n• Product questions & demos\n• GTM strategy creation\n• Account setup\n• Technical support\n\nFor immediate assistance, I can connect you with our support team via WhatsApp, Telegram, or voice call.",
        needsEscalation: true,
      }
    }

    // Default response
    return {
      content: "I understand you're asking about: " + query + "\n\nLet me help you with that. Could you provide more details, or would you like me to connect you with a human agent for personalized assistance?",
      needsEscalation: false,
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "faq":
        setInput("Show me the FAQ")
        break
      case "gtm":
        setInput("I need help with a product launch")
        break
      case "escalate":
        setShowEscalation(true)
        break
      case "voice":
        toggleVoice()
        break
    }
  }

  const toggleVoice = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      if (isListening) {
        recognition.stop()
        setIsListening(false)
      } else {
        recognition.start()
        setIsListening(true)
      }
    } else {
      alert("Voice recognition is not supported in your browser")
    }
  }

  const handleEscalation = (channel: "whatsapp" | "telegram" | "voice") => {
    setSelectedChannel(channel)
    
    const escalationMessage: Message = {
      id: Date.now().toString(),
      role: "system",
      content: `Connecting you via ${channel}... Please wait while we transfer you to a human agent.`,
      timestamp: new Date(),
      type: "escalation",
    }
    setMessages((prev) => [...prev, escalationMessage])

    // Simulate connection
    setTimeout(() => {
      const connectedMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `You're now connected via ${channel}! A human agent will be with you shortly. Your conversation history has been shared with them.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, connectedMessage])
      setShowEscalation(false)
    }, 2000)
  }

  const positionClasses = position === "bottom-right" ? "bottom-6 right-6" : "bottom-6 left-6"

  return (
    <div className={`fixed ${positionClasses} z-50`}>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageSquare className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="w-[calc(100vw-3rem)] sm:w-96 h-[70vh] sm:h-[600px] max-h-[80vh] flex flex-col shadow-2xl">
          {/* Header */}
          <CardHeader
            className="py-4 px-4 flex flex-row items-center justify-between"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-base">Nova Support</CardTitle>
                <p className="text-white/80 text-xs">AI Assistant • Online</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "system" ? (
                  <div className="w-full text-center">
                    <span
                      className="text-xs px-3 py-1 rounded-full"
                      style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                    >
                      {message.content}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "text-white"
                        : "bg-[var(--bg-tertiary)]"
                    }`}
                    style={message.role === "user" ? { backgroundColor: primaryColor } : {}}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        message.role === "user" ? "text-white/70" : "text-[var(--text-muted)]"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[var(--bg-tertiary)] rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce delay-100" />
                    <div className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Quick Actions */}
          <div className="px-4 py-2 border-t" style={{ borderColor: "var(--border-default)" }}>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1 whitespace-nowrap"
                  onClick={() => handleQuickAction(action.action)}
                >
                  <action.icon className="h-3 w-3" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Escalation Modal */}
          {showEscalation && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <Card className="w-80 mx-4">
                <CardHeader>
                  <CardTitle className="text-base">Connect with Human Agent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="secondary"
                    className="w-full justify-start gap-3"
                    onClick={() => handleEscalation("whatsapp")}
                  >
                    <Phone className="h-4 w-4 text-green-500" />
                    WhatsApp
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start gap-3"
                    onClick={() => handleEscalation("telegram")}
                  >
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    Telegram
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start gap-3"
                    onClick={() => handleEscalation("voice")}
                  >
                    <Headphones className="h-4 w-4 text-purple-500" />
                    Voice Call
                    <Phone className="h-3 w-3 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowEscalation(false)}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t" style={{ borderColor: "var(--border-default)" }}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center gap-2"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`shrink-0 ${isListening ? "text-red-500" : ""}`}
                onClick={toggleVoice}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                className="shrink-0"
                disabled={!input.trim()}
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </div>
  )
}
