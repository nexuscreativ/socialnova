import {
  LayoutDashboard,
  Calendar,
  Megaphone,
  MessageSquare,
  BarChart3,
  Bot,
  Settings,
  HelpCircle,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

export const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Content", href: "/content", icon: Calendar },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Inbox", href: "/inbox", icon: MessageSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Agents", href: "/agents", icon: Bot },
]

export const bottomNavigation: NavItem[] = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Admin", href: "/admin", icon: ShieldCheck },
  { name: "Help", href: "/help", icon: HelpCircle },
]