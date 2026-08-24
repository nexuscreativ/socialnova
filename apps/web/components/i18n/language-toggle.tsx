"use client"
import { useEffect, useState } from "react"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

const LANGS = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "fr", label: "FR" },
] as const

export function LanguageToggle() {
  const { addToast } = useToast()
  const [lang, setLang] = useState<string>("en")

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("socialnova-lang") : null
    if (saved && LANGS.some(l => l.code === saved)) setLang(saved)
  }, [])

  const cycle = () => {
    const idx = LANGS.findIndex(l => l.code === lang)
    const next = LANGS[(idx + 1) % LANGS.length]
    setLang(next.code)
    try {
      localStorage.setItem("socialnova-lang", next.code)
      window.dispatchEvent(new CustomEvent("socialnova:lang", { detail: next.code }))
    } catch {}
    addToast(`Language: ${next.label}`, "success")
  }

  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label="Change language" title={`Language: ${lang.toUpperCase()}`}>
      <Globe className="h-4 w-4" />
      <span className="sr-only">{lang}</span>
    </Button>
  )
}
