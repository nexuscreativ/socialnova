"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: "linear-gradient(135deg, var(--accent), var(--color-primary-700))" }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md text-center text-white">
          <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm mx-auto mb-6 flex items-center justify-center">
            <span className="text-2xl font-bold">S</span>
          </div>
          <h1
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            SocialNova
          </h1>
          <p className="text-lg text-white/80">
            Your Social Universe, Autonomously Managed
          </p>
          <p className="text-sm text-white/60 mt-2">
            12 specialized AI agents managing your social presence across 14 platforms.
          </p>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent)" }}>
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}
              >
                SocialNova
              </span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
