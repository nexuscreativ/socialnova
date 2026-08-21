import {
  LayoutDashboard,
  Calendar,
  Megaphone,
  MessageSquare,
  BarChart3,
  Bot,
  Users,
  CreditCard,
  ShieldCheck,
  Settings,
  HelpCircle,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  adminOnly?: boolean
}

export const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Content", href: "/content", icon: Calendar },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Inbox", href: "/inbox", icon: MessageSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Agents", href: "/agents", icon: Bot },
]

// Admin section navigation — shown when user has admin role
export const adminNav: NavItem[] = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Content", href: "/admin/content", icon: Calendar },
  { name: "Brand", href: "/admin/brand", icon: Bot },
  { name: "API", href: "/admin/api", icon: ShieldCheck },
  { name: "Integrations", href: "/admin/integrations", icon: Settings },
  { name: "Billing", href: "/admin/billing", icon: CreditCard },
  { name: "Audit", href: "/admin/audit", icon: HelpCircle },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export const bottomNavigation: NavItem[] = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Admin", href: "/admin", icon: ShieldCheck, adminOnly: true },
  { name: "Help", href: "/help", icon: HelpCircle },
]
