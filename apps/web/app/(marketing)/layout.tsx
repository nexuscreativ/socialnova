import { Navbar } from "@/components/marketing/navbar"
import { SiteFooter } from "@/components/marketing/site-footer"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
      <SiteFooter />
    </div>
  )
}