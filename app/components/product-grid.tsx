"use client"

import { useMemo, useState } from "react"
import { PlusCircle } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { getCartItemKey, useCart } from "../context/cart-context"
import type { Product } from "../context/cart-context"

interface ProductGridProps {
  category: string
  searchQuery: string
  products: Product[]
}

export default function ProductGrid({ category, searchQuery, products }: ProductGridProps) {
  const { addToCart, cart } = useCart()
  const { toast } = useToast()
  const [variantDialogProduct, setVariantDialogProduct] = useState<Product | null>(null)
  const [variantSelections, setVariantSelections] = useState<Record<number, number>>({})

  const filteredProducts = products.filter((product) => {
    const matchesCategory = category === "all" || product.category === category
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const selectedVariant = useMemo(() => {
    if (!variantDialogProduct || !variantDialogProduct.has_variantes || !variantDialogProduct.variants?.length) {
      return null
    }

    return variantDialogProduct.variants.find((variant) => variant.id === variantDialogProduct.selectedVariantId) ?? variantDialogProduct.variants[0]
  }, [variantDialogProduct])

  const handleAddToCart = (product: Product) => {
    const variantStock = product.has_variantes && product.selectedVariantId
      ? product.variants?.find((variant) => variant.id === product.selectedVariantId)?.quantite_stock ?? product.stock ?? 0
      : Number(product.stock ?? Number.POSITIVE_INFINITY)
    const itemKey = getCartItemKey(product)
    const currentQuantity = cart.find((item) => getCartItemKey(item) === itemKey)?.quantity ?? 0

    if (Number.isFinite(variantStock) && variantStock <= 0) {
      toast({
        variant: "destructive",
        title: "Produit en rupture de stock",
        description: `${product.name} ne peut pas être ajouté au panier.`,
      })
      return
    }

    if (Number.isFinite(variantStock) && currentQuantity >= variantStock) {
      toast({
        variant: "destructive",
        title: "Stock insuffisant",
        description: `Il n'y a plus assez de stock pour ${product.name}.`,
      })
      return
    }

    addToCart(product)
  }

  const handleProductClick = (product: Product) => {
    if (product.has_variantes && product.variants?.length) {
      setVariantDialogProduct({ ...product, selectedVariantId: product.selectedVariantId ?? product.variants[0].id })
      setVariantSelections(
        Object.fromEntries(product.variants.map((variant) => [variant.id, 0]))
      )
      return
    }

    handleAddToCart(product)
  }

  const confirmVariantSelection = () => {
    if (!variantDialogProduct) return

    const selectedVariants = variantDialogProduct.variants?.filter((variant) => Number(variantSelections[variant.id] ?? 0) > 0) ?? []

    if (selectedVariants.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucune variante sélectionnée",
        description: "Choisissez au moins une variante avec une quantité valide.",
      })
      return
    }

    let added = false

    for (const variant of selectedVariants) {
      const quantity = Number(variantSelections[variant.id] ?? 0)
      const variantAwareProduct = {
        ...variantDialogProduct,
        selectedVariantId: variant.id,
        variantCombination: variant.combinaison ?? null,
        stock: Number(variant.quantite_stock ?? variantDialogProduct.stock ?? 0),
        name: `${variantDialogProduct.name}${variant.combinaison ? ` - ${Object.values(variant.combinaison).join(" / ")}` : ""}`,
      }

      for (let index = 0; index < quantity; index += 1) {
        const wasAdded = addToCart(variantAwareProduct)
        if (wasAdded) {
          added = true
        }
      }
    }

    if (added) {
      toast({
        title: "Variantes ajoutées au panier",
        description: `${selectedVariants.length} variante(s) ajoutée(s).`,
      })
    }

    setVariantDialogProduct(null)
    setVariantSelections({})
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {filteredProducts.map((product) => (
        <Card
          key={product.id}
          className={`group w-full overflow-hidden transition-all duration-200 ${
            (product.stock ?? 0) <= 0
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:scale-105 hover:shadow-md"
          }`}
          onClick={() => handleProductClick(product)}
        >
          <div className="relative aspect-square">
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 z-10">
              <PlusCircle className="h-10 w-10 text-white" />
            </div>
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {(product.stock ?? 0) <= 0 && (
              <div className="absolute left-2 top-2 z-10">
                <Badge variant="destructive" className="text-[10px] uppercase tracking-wide">
                  {product.has_variantes ? "Variantes" : "Rupture"}
                </Badge>
              </div>
            )}
            {(product.stock ?? 0) > 0 && (
              <div className="absolute left-2 top-2 z-10">
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                  {product.has_variantes ? `Var. ${product.stock}` : `Stock ${product.stock}`}
                </Badge>
              </div>
            )}
          </div>
          <CardContent className="p-2">
            <div className="space-y-0.5 sm:space-y-1">
              {product.categoryLabel && (
                <Badge variant="secondary" className="hidden text-[10px] uppercase tracking-wide sm:inline-flex">
                  {product.categoryLabel}
                </Badge>
              )}
              <h3 className="line-clamp-2 text-[11px] font-medium leading-tight sm:line-clamp-1 sm:text-sm">
                {product.name}
              </h3>
              {product.has_variantes && (
                <Badge variant="outline" className="text-[9px] uppercase tracking-wide">
                  Variantes
                </Badge>
              )}
              <p className="text-[11px] font-semibold text-emerald-600 sm:text-sm">
                {(product.currencySymbol ?? "$")}{product.price.toFixed(2)}
              </p>
              {(product.stock ?? 0) > 0 && <p className="hidden text-[11px] text-muted-foreground sm:block">{product.has_variantes ? "Stock variantes" : "Disponible immédiatement"}</p>}
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredProducts.length === 0 && (
        <div className="col-span-full py-12 text-center">
          <p className="text-muted-foreground">Aucun produit trouvé</p>
        </div>
      )}

      <Dialog open={Boolean(variantDialogProduct)} onOpenChange={(open) => !open && setVariantDialogProduct(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sélectionner une variante</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {variantDialogProduct?.variants?.map((variant) => {
              const quantity = Number(variantSelections[variant.id] ?? 0)
              const label = variant.combinaison ? Object.values(variant.combinaison).join(" / ") : `Variante ${variant.id}`
              const isStockEmpty = Number(variant.quantite_stock ?? 0) <= 0

              return (
                <div key={variant.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                  <input
                    type="checkbox"
                    checked={quantity > 0}
                    disabled={isStockEmpty}
                    onChange={(event) => {
                      const checked = event.target.checked
                      setVariantSelections((prev) => ({
                        ...prev,
                        [variant.id]: checked ? Math.max(1, Number(prev[variant.id] ?? 1)) : 0,
                      }))
                    }}
                    className="h-4 w-4"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">Stock: {Number(variant.quantite_stock ?? 0)}</div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={Number(variant.quantite_stock ?? 0)}
                    value={quantity}
                    disabled={isStockEmpty}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value)
                      setVariantSelections((prev) => ({
                        ...prev,
                        [variant.id]: Number.isFinite(nextValue) && nextValue > 0 ? Math.min(nextValue, Number(variant.quantite_stock ?? 0)) : 0,
                      }))
                    }}
                    className="h-9 w-16 rounded-md border px-2 text-sm"
                  />
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setVariantDialogProduct(null)}>
              Annuler
            </Button>
            <Button type="button" onClick={confirmVariantSelection}>
              Ajouter au panier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
