"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"

export default function SignupPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const passwordChecks = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Passwords match", met: password === confirmPassword && confirmPassword.length > 0 },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      addToast("Passwords do not match", "error")
      return
    }
    setLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      addToast("Account created! Please verify your email.", "success")
      router.push("/verify-email")
    } catch {
      addToast("Failed to create account", "error")
    } finally {
      setLoading(false)
    }
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
          Create your account
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Start managing your social universe with AI
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" aria-label="Signup form">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
            Full name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
            <Input
              id="name"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
              className="pl-10"
            />
          </div>
        </div>

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

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
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
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="pl-10"
            />
          </div>
        </div>

        {/* Password strength indicators */}
        {password.length > 0 && (
          <div className="space-y-1.5">
            {passwordChecks.map(check => (
              <div key={check.label} className="flex items-center gap-2 text-xs">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: check.met ? "var(--color-success)" : "var(--text-muted)" }}
                />
                <span style={{ color: check.met ? "var(--color-success)" : "var(--text-muted)" }}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Create account
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="hover:underline" style={{ color: "var(--accent)" }}>Terms</Link>
        {" "}and{" "}
        <Link href="/privacy" className="hover:underline" style={{ color: "var(--accent)" }}>Privacy Policy</Link>
      </p>

      <p className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
