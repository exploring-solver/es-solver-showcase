// AddToCartButton client component
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/app/components/ui/button";
import { ShoppingCart } from "lucide-react";

export function AddToCartButton({ 
  productId, 
  disabled 
}: { 
  productId: string; 
  disabled: boolean 
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const addToCart = async () => {
    setLoading(true)
    
    try {
      const response = await fetch("/api/ecommerce/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to add to cart")
      }
      
      toast("Added to cart",{
        description: "Item has been added to your cart",
      })

      // Refresh the page to update any cart components
      router.refresh()
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast.error("Failed to add item to cart")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={addToCart}
        disabled={disabled || loading}
        className="w-full"
      >
        {loading ? (
          "Adding..."
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </>
        )}
      </Button>
      <Button 
        variant="outline"
        onClick={() => router.push("/module/ecommerce/cart")}
        className="w-full"
      >
        View Cart
      </Button>
    </div>
  )
}
