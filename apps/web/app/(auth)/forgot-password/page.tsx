"use client"
import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"

export default function ForgotPasswordPage() {
  const { addToast } = useToast()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSent(true)
    } catch {
      addToast("Failed to send reset email", "error")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div
          className="h-16 w-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-success) 15%, transparent)" }}
        >
          <CheckCircle className="h-8 w-8" style={{ color: "var(--color-success)" }} />
        </div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
        >
          Check your email
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          We sent a password reset link to <strong>{email}</strong>.
          <br />
          Check your inbox and follow the instructions.
        </p>
        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full h-10 rounded-lg border text-sm font-medium transition-colors hover:bg-[var(--bg-tertiary)]"
            style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to sign in
          </Link>
        </div>
        <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          Didn&apos;t receive the email?{" "}
          <button
            onClick={() => { setSent(false); setEmail("") }}
            className="font-medium hover:underline"
            style={{ color: "var(--accent)" }}
          >
            Try again
          </button>
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
        >
          Forgot your password?
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" aria-label="Forgot password form">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="pl-10"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Send reset link
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Remember your password?{" "}
        <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
