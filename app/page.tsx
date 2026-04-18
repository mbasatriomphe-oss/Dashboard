"use client"

import { useState, useEffect, useCallback } from "react"
import ProductGrid from "./components/product-grid"
import CartSidebar from "./components/cart-sidebar"
import CategorySidebar from "./components/category-sidebar"
import Header from "./components/header"
import { useAuth } from "./context/auth-context"
import { useSettings } from "./context/settings-context"
import { useCart } from "./context/cart-context"
import { useRouter } from "next/navigation"

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const { user, isLoading } = useAuth()
  const { settings } = useSettings()
  const { clearCart } = useCart()
  const router = useRouter()

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!settings.quickActionsEnabled) return

    // Check if user is typing in an input
    const target = e.target as HTMLElement
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      if (e.key === "Escape") {
        target.blur()
      }
      return
    }

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault()
          clearCart()
          break
        case "p":
          e.preventDefault()
          router.push("/checkout")
          break
        case "f":
          e.preventDefault()
          const searchInput = document.querySelector('input[placeholder="Search products..."]') as HTMLInputElement
          searchInput?.focus()
          break
        case "d":
          e.preventDefault()
          // Trigger discount modal (handled by cart sidebar)
          const discountBtn = document.querySelector('[data-discount-trigger]') as HTMLButtonElement
          discountBtn?.click()
          break
      }
    }

    if (e.key === "Escape") {
      clearCart()
      setSearchQuery("")
    }
  }, [settings.quickActionsEnabled, clearCart, router])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If no user, the auth context will redirect to login
  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <CategorySidebar selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <div className="flex-1 overflow-auto p-4">
          <ProductGrid category={selectedCategory} searchQuery={searchQuery} />
        </div>
      </main>

      <CartSidebar />
    </div>
  )
}
