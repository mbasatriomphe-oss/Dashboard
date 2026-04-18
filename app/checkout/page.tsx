"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Wallet, AlertCircle, CheckCircle2, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCart } from "../context/cart-context"
import { useAuth } from "../context/auth-context"
import { db } from "../services/database"

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, cartTotal, clearCart, customer, discountAmount } = useCart()
  const { user, isLoading: authLoading } = useAuth()
  
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Partial payment states
  const [paymentAmount, setPaymentAmount] = useState("")
  const [isPartialPayment, setIsPartialPayment] = useState(false)
  
  // Card details states
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardError, setCardError] = useState("")

  const tax = cartTotal * 0.1
  const grandTotal = cartTotal - discountAmount + tax

  // Set initial payment amount to full amount
  useEffect(() => {
    setPaymentAmount(grandTotal.toFixed(2))
  }, [grandTotal])

  // Calculate remaining balance
  const paymentAmountNum = parseFloat(paymentAmount) || 0
  const remainingBalance = grandTotal - paymentAmountNum
  const isFullPayment = paymentAmountNum >= grandTotal

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  // Format expiry date
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4)
    }
    return v
  }

  // Validate card
  const validateCard = () => {
    if (paymentMethod !== "card") return true
    
    const cardNumClean = cardNumber.replace(/\s/g, "")
    if (cardNumClean.length < 13 || cardNumClean.length > 19) {
      setCardError("Please enter a valid card number")
      return false
    }
    
    if (!cardExpiry || cardExpiry.length !== 5) {
      setCardError("Please enter a valid expiry date (MM/YY)")
      return false
    }
    
    if (!cardCvv || cardCvv.length < 3) {
      setCardError("Please enter a valid CVV")
      return false
    }
    
    if (!cardName.trim()) {
      setCardError("Please enter the cardholder name")
      return false
    }
    
    setCardError("")
    return true
  }

  const handlePayment = async () => {
    // Validate payment amount
    if (paymentAmountNum <= 0) {
      return
    }
    
    // Validate card if paying by card
    if (!validateCard()) {
      return
    }
    
    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const transaction = {
      id: Date.now().toString(),
      customerId: customer?.id,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      })),
      subtotal: cartTotal,
      tax: tax,
      discount: discountAmount,
      total: grandTotal,
      amountPaid: paymentAmountNum,
      remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
      isPartialPayment: !isFullPayment,
      paymentMethod: paymentMethod,
      cardLastFour: paymentMethod === "card" ? cardNumber.slice(-4) : undefined,
      timestamp: new Date(),
      receiptNumber: Math.floor(100000 + Math.random() * 900000).toString(),
      processedBy: user?.name,
    }

    // Save transaction
    await db.saveTransaction(transaction)

    // Update customer loyalty points and spending
    if (customer) {
      const updatedCustomer = {
        ...customer,
        loyaltyPoints: customer.loyaltyPoints + Math.floor(paymentAmountNum),
        totalSpent: customer.totalSpent + paymentAmountNum,
        lastVisit: new Date(),
      }
      await db.saveCustomer(updatedCustomer)
    }

    // Update inventory
    for (const item of cart) {
      await db.updateStock(item.id, item.quantity)
    }

    clearCart()
    router.push(`/success?amount=${paymentAmountNum}&remaining=${remainingBalance > 0 ? remainingBalance : 0}&receipt=${transaction.receiptNumber}`)
  }

  // Auth loading state
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (cart.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Add some items to your cart before checkout</p>
          <Button className="mt-4" onClick={() => router.push("/")}>
            Return to POS
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-5xl px-4">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to POS
        </Button>

        <h1 className="mb-6 text-3xl font-bold text-foreground">Checkout</h1>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-foreground">
                    <p>Subtotal</p>
                    <p>${cartTotal.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-foreground">
                    <p>Tax (10%)</p>
                    <p>${tax.toFixed(2)}</p>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <p>Discount</p>
                      <p>-${discountAmount.toFixed(2)}</p>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <p>Total</p>
                    <p>${grandTotal.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Amount */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Payment Amount
                  <span className="text-xs font-normal text-muted-foreground">
                    (Partial payment supported)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount to Pay</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={grandTotal}
                      value={paymentAmount}
                      onChange={(e) => {
                        setPaymentAmount(e.target.value)
                        setIsPartialPayment(parseFloat(e.target.value) < grandTotal)
                      }}
                      className="pl-7 text-lg font-semibold"
                    />
                  </div>
                </div>

                {/* Quick amount buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(grandTotal.toFixed(2))}
                    className={paymentAmountNum === grandTotal ? "border-primary bg-primary/10" : ""}
                  >
                    Full Amount
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount((grandTotal / 2).toFixed(2))}
                  >
                    50%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount((grandTotal / 4).toFixed(2))}
                  >
                    25%
                  </Button>
                </div>

                {/* Remaining balance info */}
                {!isFullPayment && paymentAmountNum > 0 && (
                  <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      Partial payment of <strong>${paymentAmountNum.toFixed(2)}</strong>. 
                      Remaining balance: <strong>${remainingBalance.toFixed(2)}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                {isFullPayment && paymentAmountNum > 0 && (
                  <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                      Full payment - no remaining balance
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Method */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className={`flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-colors ${
                    paymentMethod === "card" ? "border-primary bg-primary/5" : ""
                  }`}>
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center cursor-pointer flex-1">
                      <CreditCard className="mr-2 h-5 w-5" />
                      Credit/Debit Card
                    </Label>
                  </div>

                  <div className={`mt-3 flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-colors ${
                    paymentMethod === "cash" ? "border-primary bg-primary/5" : ""
                  }`}>
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center cursor-pointer flex-1">
                      <Wallet className="mr-2 h-5 w-5" />
                      Cash
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Card Details - only show when card is selected */}
            {paymentMethod === "card" && (
              <Card>
                <CardHeader>
                  <CardTitle>Card Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cardError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{cardError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label>Card Number</Label>
                    <Input
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cardholder Name</Label>
                    <Input
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Input
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <Input
                        placeholder="123"
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        maxLength={4}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Complete Payment Button */}
            <Button
              className="w-full h-14 text-lg font-semibold"
              size="lg"
              onClick={handlePayment}
              disabled={isProcessing || paymentAmountNum <= 0}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing Payment...
                </div>
              ) : (
                <>
                  {isFullPayment ? "Complete Payment" : "Process Partial Payment"} - ${paymentAmountNum.toFixed(2)}
                </>
              )}
            </Button>

            {/* Security note */}
            <p className="text-xs text-center text-muted-foreground">
              Your payment information is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
