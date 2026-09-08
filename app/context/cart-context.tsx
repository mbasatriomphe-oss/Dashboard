"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"

export interface ProductVariant {
  id: number
  code_sku?: string
  combinaison?: Record<string, string> | null
  prix_vente?: number
  quantite_stock?: number
  seuil_alerte?: number
}

export interface Product {
  id: number
  name: string
  price: number
  image: string
  category: string
  categoryLabel?: string
  currencySymbol?: string
  stock?: number
  has_variantes?: boolean
  variants?: ProductVariant[]
  selectedVariantId?: number | null
  variantCombination?: Record<string, string> | null
}

interface Discount {
  id: string
  type: "percentage" | "fixed"
  value: number
  description: string
  minAmount?: number
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  loyaltyPoints: number
  totalSpent: number
  purchaseHistory: Transaction[]
}

interface Transaction {
  id: string
  customerId?: string
  items: CartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  timestamp: Date
  receiptNumber: string
}

interface CartItem extends Product {
  quantity: number
}

export function getCartItemKey(product: Pick<Product, "id" | "selectedVariantId">) {
  return product.selectedVariantId ? `product:${product.id}:variant:${product.selectedVariantId}` : `product:${product.id}:base`
}

function normalizeCartItems(items: CartItem[]) {
  const merged = new Map<string, CartItem>()

  for (const item of items) {
    const itemKey = getCartItemKey(item)
    const existingItem = merged.get(itemKey)

    if (existingItem) {
      merged.set(itemKey, { ...existingItem, quantity: Number(existingItem.quantity) + Number(item.quantity || 0) })
      continue
    }

    merged.set(itemKey, { ...item, quantity: Number(item.quantity || 0) })
  }

  return Array.from(merged.values())
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: Product) => boolean
  removeFromCart: (productId: number, variantId?: number | null) => void
  updateQuantity: (productId: number, quantity: number, variantId?: number | null) => void
  clearCart: () => void
  cartTotal: number
  itemCount: number
  appliedDiscount: Discount | null
  applyDiscount: (discount: Discount) => void
  removeDiscount: () => void
  discountAmount: number
  customer: Customer | null
  setCustomer: (customer: Customer | null) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart) as CartItem[]
        setCart(normalizeCartItems(parsedCart))
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(normalizeCartItems(cart)))
  }, [cart])

  const addToCart = (product: Product) => {
    let added = false

    setCart((prevCart) => {
      const normalizedPrevCart = normalizeCartItems(prevCart)
      const itemKey = getCartItemKey(product)
      const existingItem = normalizedPrevCart.find((item) => getCartItemKey(item) === itemKey)
      const stockLimit = Number(product.stock ?? Number.POSITIVE_INFINITY)

      if (Number.isFinite(stockLimit) && stockLimit <= 0) {
        return normalizedPrevCart
      }

      if (existingItem && Number.isFinite(stockLimit) && existingItem.quantity >= stockLimit) {
        return normalizedPrevCart
      }

      if (existingItem) {
        added = true
        return normalizeCartItems(normalizedPrevCart.map((item) => (getCartItemKey(item) === itemKey ? { ...item, quantity: item.quantity + 1 } : item)))
      }

      added = true
      return normalizeCartItems([...normalizedPrevCart, { ...product, quantity: 1 }])
    })

    return added
  }

  const removeFromCart = (productId: number, variantId?: number | null) => {
    const variantKey = variantId ?? null
    setCart((prevCart) => prevCart.filter((item) => {
      const matches = item.id === productId && (item.selectedVariantId ?? null) === variantKey
      return !matches
    }))
  }

  const updateQuantity = (productId: number, quantity: number, variantId?: number | null) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId)
      return
    }

    setCart((prevCart) => prevCart.map((item) => (
      item.id === productId && (item.selectedVariantId ?? null) === (variantId ?? null) ? { ...item, quantity } : item
    )))
  }

  const clearCart = () => {
    setCart([])
  }

  const applyDiscount = (discount: Discount) => {
    if (discount.minAmount && cartTotal < discount.minAmount) {
      return
    }
    setAppliedDiscount(discount)
  }

  const removeDiscount = () => {
    setAppliedDiscount(null)
  }

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  const discountAmount = appliedDiscount
    ? appliedDiscount.type === "percentage"
      ? cartTotal * (appliedDiscount.value / 100)
      : appliedDiscount.value
    : 0

  const itemCount = cart.reduce((count, item) => count + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        itemCount,
        appliedDiscount,
        applyDiscount,
        removeDiscount,
        discountAmount,
        customer,
        setCustomer,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
