"use client"
import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { addToast } = useToast()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      addToast("Passwords do not match", "error")
      return
    }
    if (password.length < 8) {
      addToast("Password must be at least 8 characters", "error")
      return
    }
    setLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSuccess(true)
    } catch {
      addToast("Failed to reset password. The link may have expired.", "error")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
          Password reset complete
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Your password has been successfully updated.
        </p>
        <Button className="w-full" onClick={() => router.push("/login")}>
          <span className="flex items-center gap-2">
            Sign in with new password
            <ArrowRight className="h-4 w-4" />
          </span>
        </Button>
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
          Set new password
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Choose a strong password for your account
        </p>
      </div>

      {!token && (
        <div
          className="mb-4 p-3 rounded-lg text-sm"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-warning) 10%, transparent)", color: "var(--color-warning)" }}
        >
          No reset token found. Please use the link from your email.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" aria-label="Reset password form">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
            New password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
              style={{ color: "var(--text-muted)" }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
            Confirm new password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="pl-10"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading || !token}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Resetting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Reset password
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
          Back to sign in
        </Link>
      </p>
    </motion.div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
