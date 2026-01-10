import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter, Outfit, Space_Grotesk, DM_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { createClient } from "@/lib/supabase/server"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
})

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
})

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Goal Tracker",
  description: "Track your team and individual goals",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Fetch initial preferences server-side to prevent flash
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialPreferences = null
  if (user) {
    const { data } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single()
    initialPreferences = data
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          ${inter.variable}
          ${outfit.variable}
          ${spaceGrotesk.variable}
          ${dmSans.variable}
          antialiased
        `}
      >
        <ThemeProvider initialPreferences={initialPreferences}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
