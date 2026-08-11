"use client"
import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, ArrowRight, RefreshCw, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

export default function VerifyEmailPage() {
  const { addToast } = useToast()
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleResend = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setResent(true)
      addToast("Verification email sent!", "success")
    } catch {
      addToast("Failed to resend email", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center"
    >
      <div
        className="h-16 w-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
        style={{ backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}
      >
        <Mail className="h-8 w-8" style={{ color: "var(--accent)" }} />
      </div>

      <h1
        className="text-2xl font-bold mb-2"
        style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
      >
        Verify your email
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
        We sent a verification link to your email address.
        <br />
        Click the link to activate your account.
      </p>

      <div className="space-y-3">
        <Button
          onClick={handleResend}
          variant="secondary"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Sending...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              {resent ? "Resend verification email" : "Resend email"}
            </span>
          )}
        </Button>

        {resent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center justify-center gap-2 text-sm"
            style={{ color: "var(--color-success)" }}
          >
            <CheckCircle className="h-4 w-4" />
            Email sent! Check your inbox.
          </motion.div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t" style={{ borderColor: "var(--border-default)" }}>
        <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
          Wrong email address?
        </p>
        <Link
          href="/signup"
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--accent)" }}
        >
          Create a new account
        </Link>
      </div>

      <p className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
        Already verified?{" "}
        <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
