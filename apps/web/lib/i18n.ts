"use client"
import { useEffect, useState } from "react"

type Dict = Record<string, string>

const en: Dict = {
  dashboard: "Dashboard",
  content: "Content",
  campaigns: "Campaigns",
  inbox: "Inbox",
  analytics: "Analytics",
  agents: "Agents",
  chat: "Chat",
  settings: "Settings",
  admin: "Admin",
  searchPlaceholder: "Search or press Cmd+K…",
  welcome: "Welcome back",
}

const es: Dict = {
  dashboard: "Panel",
  content: "Contenido",
  campaigns: "Campañas",
  inbox: "Bandeja",
  analytics: "Analíticas",
  agents: "Agentes",
  chat: "Chat",
  settings: "Ajustes",
  admin: "Admin",
  searchPlaceholder: "Buscar o pulsa Cmd+K…",
  welcome: "Bienvenido",
}

const fr: Dict = {
  dashboard: "Tableau de bord",
  content: "Contenu",
  campaigns: "Campagnes",
  inbox: "Boîte de réception",
  analytics: "Analytiques",
  agents: "Agents",
  chat: "Chat",
  settings: "Paramètres",
  admin: "Admin",
  searchPlaceholder: "Rechercher ou appuyez sur Cmd+K…",
  welcome: "Bienvenue",
}

const dicts: Record<string, Dict> = { en, es, fr }

export function useT() {
  const [lang, setLang] = useState("en")
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("socialnova-lang") : null
    if (saved && dicts[saved]) setLang(saved)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "socialnova-lang" && e.newValue && dicts[e.newValue]) setLang(e.newValue)
    }
    window.addEventListener("storage", onStorage)
    // also listen for custom event from LanguageToggle
    const onLang = (e: Event) => {
      const ce = e as CustomEvent<string>
      if (ce.detail && dicts[ce.detail]) setLang(ce.detail)
    }
    window.addEventListener("socialnova:lang" as unknown as string, onLang as EventListener)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("socialnova:lang" as unknown as string, onLang as EventListener)
    }
  }, [])
  const t = (key: string) => dicts[lang]?.[key] ?? dicts.en[key] ?? key
  return { t, lang }
}
