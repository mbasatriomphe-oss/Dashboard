"use client"

import { useState, useEffect, useCallback } from "react"
import { ShoppingCart } from "lucide-react"
import ProductGrid from "./components/product-grid"
import CartSidebar from "./components/cart-sidebar"
import CategorySidebar from "./components/category-sidebar"
import Header from "./components/header"
import { useAuth } from "./context/auth-context"
import { useSettings } from "./context/settings-context"
import { useCart } from "./context/cart-context"
import { useRouter } from "next/navigation"
import { backendRequest } from "./services/backend"
import type { Product } from "./context/cart-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"

type POSSettings = {
  quickActionsEnabled: boolean
}

type BackendCategory = {
  id: number
  nom: string
}

type BackendProduct = {
  id: number
  code: string
  nom: string
  photo: string | null
  categorie?: BackendCategory
}

type BackendLot = {
  id: number
  id_produit: number
  ligne_approvisionnement?: {
    prix_vente?: string | null
    prix_unitaire?: string | null
  }
  devise?: {
    code?: string
    symbole?: string
  }
}

type StockRow = {
  id: number
  code: string
  nom: string
  stock_actuel: number
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getPhotoUrl(photo: string | null | undefined) {
  if (!photo) return "/placeholder.svg"
  if (photo.startsWith("http://") || photo.startsWith("https://") || photo.startsWith("blob:")) return photo
  // Use relative path — proxied through Next.js /storage/* rewrite
  return `/storage/${photo.replace(/^\/+/, "")}`
}

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const { user, isLoading } = useAuth()
  const { settings } = useSettings() as { settings: POSSettings }
  const { clearCart, itemCount } = useCart()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([{ id: "all", name: "Tous les produits" }])
  const [loadingProducts, setLoadingProducts] = useState(true)

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
          const searchInput = document.querySelector('input[placeholder="Rechercher des produits..."]') as HTMLInputElement
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

  useEffect(() => {
    if (!user) return

    let cancelled = false

    const loadProducts = async () => {
      setLoadingProducts(true)
      try {
        const [productRes, lotRes, stockRes] = await Promise.all([
          backendRequest<{ data: BackendProduct[] }>("/produits?per_page=all").catch(() => ({ data: [] })),
          backendRequest<{ data: BackendLot[] }>("/lots?per_page=all").catch(() => ({ data: [] })),
          backendRequest<{ data: StockRow[] }>("/stocks/disponible").catch(() => ({ data: [] })),
        ])

        const latestLotByProduct = new Map<number, BackendLot>()
        for (const lot of lotRes.data ?? []) {
          if (!latestLotByProduct.has(lot.id_produit)) {
            latestLotByProduct.set(lot.id_produit, lot)
          }
        }

        const productById = new Map<number, BackendProduct>()
        for (const product of productRes.data ?? []) {
          productById.set(product.id, product)
        }

        const stockById = new Map<number, StockRow>()
        for (const row of stockRes.data ?? []) {
          stockById.set(row.id, row)
        }

        const sourceRows: StockRow[] = []
        const seenIds = new Set<number>()

        for (const product of productRes.data ?? []) {
          seenIds.add(product.id)
          sourceRows.push({
            id: product.id,
            code: product.code,
            nom: product.nom,
            stock_actuel: Number(stockById.get(product.id)?.stock_actuel ?? 0),
          })
        }

        for (const row of stockRes.data ?? []) {
          if (seenIds.has(row.id)) {
            continue
          }

          sourceRows.push({
            id: row.id,
            code: row.code,
            nom: row.nom,
            stock_actuel: Number(row.stock_actuel ?? 0),
          })
        }

        const mappedProducts: Product[] = sourceRows.map((row) => {
          const product = productById.get(row.id)
          const latestLot = latestLotByProduct.get(row.id)
          const price = Number(latestLot?.ligne_approvisionnement?.prix_vente ?? latestLot?.ligne_approvisionnement?.prix_unitaire ?? 0)
          const categoryName = product?.categorie?.nom ?? "Autres"
          const currencySymbol = latestLot?.devise?.symbole ?? latestLot?.devise?.code ?? "$"

          return {
            id: row.id,
            name: product?.nom ?? row.nom,
            price,
            image: getPhotoUrl(product?.photo ?? null),
            category: slugify(categoryName) || "autres",
            categoryLabel: categoryName,
            currencySymbol,
            stock: Number(row.stock_actuel ?? 0),
          }
        })

        const categoryEntries = new Map<string, { id: string; name: string }>()

        for (const product of productRes.data ?? []) {
          const categoryName = product.categorie?.nom?.trim() || "Autres"
          const categoryId = slugify(categoryName) || "autres"

          if (!categoryEntries.has(categoryId)) {
            categoryEntries.set(categoryId, {
              id: categoryId,
              name: categoryName,
            })
          }
        }

        const mappedCategories = [
          { id: "all", name: "Tous les produits" },
          ...Array.from(categoryEntries.values()).sort((left, right) => left.name.localeCompare(right.name)),
        ]

        if (!cancelled) {
          setProducts(mappedProducts)
          setCategories(mappedCategories)
        }
      } catch {
        if (!cancelled) {
          setProducts([])
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false)
        }
      }
    }

    const refreshProducts = () => {
      void loadProducts()
    }

    refreshProducts()

    window.addEventListener("focus", refreshProducts)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshProducts()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      cancelled = true
      window.removeEventListener("focus", refreshProducts)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [user])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  // If no user, the auth context will redirect to login
  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <CategorySidebar selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} categories={categories} />

      <main className="flex min-h-0 flex-1 flex-col">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <div className="flex-1 overflow-auto p-3 sm:p-4">
          <ProductGrid category={selectedCategory} searchQuery={searchQuery} products={products} />
        </div>
      </main>

      <div className="hidden md:block">
        <CartSidebar />
      </div>

      <Button
        type="button"
        className="fixed bottom-4 right-4 z-30 h-14 w-14 rounded-full shadow-lg md:hidden"
        size="icon"
        onClick={() => setMobileCartOpen(true)}
        aria-label="Ouvrir le panier"
      >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <Badge className="absolute -right-1 -top-1 h-6 min-w-6 rounded-full px-1.5 text-[10px] leading-none">
            {itemCount}
          </Badge>
        )}
      </Button>

      <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
        <SheetContent side="right" className="w-[100vw] max-w-sm p-0 sm:w-[88vw]">
          <SheetTitle className="sr-only">Panier mobile</SheetTitle>
          <SheetDescription className="sr-only">
            Consultez les produits ajoutés au panier et passez au paiement.
          </SheetDescription>
          <CartSidebar />
        </SheetContent>
      </Sheet>
    </div>
  )
}
