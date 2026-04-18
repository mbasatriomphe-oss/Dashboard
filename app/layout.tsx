import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from "./context/cart-context"
import { AuthProvider } from "./context/auth-context"
import { ThemeProvider } from "./context/theme-context"
import { SettingsProvider } from "./context/settings-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HeroUI POS System",
  description: "Professional Point of Sale System",
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background`}>
        <ThemeProvider>
          <AuthProvider>
            <SettingsProvider>
              <CartProvider>{children}</CartProvider>
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
