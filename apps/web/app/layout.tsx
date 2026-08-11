import type { Metadata } from "next"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { ToastProvider } from "@/components/ui/toast"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { SupportChatBubble } from "@/components/support/chat-bubble"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
})

export const metadata: Metadata = {
  title: "SocialNova - Your Social Universe, Autonomously Managed",
  description: "AI-powered social media management with 12 specialized autonomous agents. Plan, publish, engage and sell across 14 platforms.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable}`}>
      <body>
        <ErrorBoundary>
          <ThemeProvider>
            <ToastProvider>
              {children}
              <SupportChatBubble />
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
