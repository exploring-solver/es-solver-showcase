"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CartItem } from "./cart-item"
import { ShoppingBag, ShoppingCart, Loader2 } from "lucide-react"
import { toast } from "sonner"

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CartProps {
  initialCartItems?: any[]
}

export function Cart({ initialCartItems }: CartProps) {
  const router = useRouter()
  const [cartItems, setCartItems] = React.useState(initialCartItems || [])
  const [loading, setLoading] = React.useState(!initialCartItems)
  const [checkoutLoading, setCheckoutLoading] = React.useState(false)
  const [scriptLoaded, setScriptLoaded] = React.useState(false)

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
      // Call the API to create an order and get the Razorpay order details
      const response = await fetch("/api/ecommerce/checkout", {
        method: "POST",
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create order")
      }
      
      const data = await response.json()
      
      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "Your Store Name",
        description: "Purchase from Your Store",
        order_id: data.id,
        handler: async function (response: any) {
          try {
            // Verify the payment signature
            const verifyResponse = await fetch("/api/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderCreationId: data.id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })
            
            const verifyData = await verifyResponse.json()
            
            if (verifyData.isOk) {
              // Update cart items state
              setCartItems([])
              
              // Redirect to success page
              router.push(`/module/ecommerce/checkout/success?orderId=${data.orderId}`)
            } else {
              toast.error("Payment verification failed: " + verifyData.message)
              setCheckoutLoading(false)
            }
          } catch (error) {
            console.error("Verification error:", error)
            toast.error("Payment verification failed. Please try again.")
            setCheckoutLoading(false)
          }
        },
        prefill: {
          name: "", // You can prefill with user data if available
          email: "",
          contact: "",
        },
        notes: {
          address: "Your Store Address"
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: function() {
            setCheckoutLoading(false)
          }
        }
      }
      
      const paymentObject = new window.Razorpay(options)
      
      paymentObject.on("payment.failed", function (response: any) {
        toast.error(response.error.description)
        setCheckoutLoading(false)
      })
      
      paymentObject.open()
    } catch (error) {
      console.error("Checkout error:", error)
      toast.error("Failed to proceed to checkout. Please try again.")
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
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptLoaded(true)}
      />
      
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
              disabled={checkoutLoading || !scriptLoaded}
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
    </>
  )
}