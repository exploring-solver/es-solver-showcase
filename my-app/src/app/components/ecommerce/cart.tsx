"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CartItem } from "./cart-item"
import { ShoppingBag, ShoppingCart, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CartProps {
  initialCartItems?: any[]
}

export function Cart({ initialCartItems }: CartProps) {
  const router = useRouter()
  const [cartItems, setCartItems] = React.useState(initialCartItems || [])
  const [loading, setLoading] = React.useState(!initialCartItems)
  const [checkoutLoading, setCheckoutLoading] = React.useState(false)

  React.useEffect(() => {
    if (!initialCartItems) {
      fetchCart()
    }
  }, [initialCartItems])

  const fetchCart = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/ecommerce/cart")
      
      if (!response.ok) {
        throw new Error("Failed to fetch cart")
      }
      
      const data = await response.json()
      setCartItems(data)
    } catch (error) {
      console.error("Error fetching cart:", error)
      toast.error("Failed to load your cart. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    try {
      const response = await fetch("/api/ecommerce/checkout", {
        method: "POST",
      })
      
      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }
      
      const { url } = await response.json()
      
      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error("Error creating checkout:", error)
      toast.error("Failed to proceed to checkout. Please try again.")
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Calculate total
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Cart</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading your cart...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Cart</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-muted p-6">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Browse our products and add some items to your cart.
              </p>
            </div>
            <Button 
              onClick={() => router.push("/module/ecommerce")}
              className="mt-2"
            >
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Your Cart
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cartItems.map((item: any) => (
            <React.Fragment key={item.id}>
              <CartItem item={item} onUpdate={fetchCart} />
              <Separator />
            </React.Fragment>
          ))}
          
          <div className="space-y-1.5 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full flex-col gap-2">
          <Button
            onClick={handleCheckout}
            className="w-full"
            disabled={checkoutLoading}
          >
            {checkoutLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Checkout"
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/module/ecommerce")}
          >
            Continue Shopping
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}