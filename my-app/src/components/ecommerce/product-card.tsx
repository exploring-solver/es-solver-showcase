"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingCart } from "lucide-react"
import { toast } from "sonner"

interface ProductCardProps {
  product: {
    id: string
    name: string
    description: string
    price: number
    images: string[]
    category: string
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoading(true)

    try {
      const response = await fetch("/api/ecommerce/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add item to cart")
      }

      toast("Added to cart",{
        description: `${product.name} has been added to your cart.`,
      })
    } catch (error) {
      toast.error("Could not add item to cart. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const navigateToProduct = () => {
    router.push(`/module/ecommerce/products/${product.id}`)
  }

  // Placeholder image if no images are available
  const imageUrl = product.images && product.images.length > 0
    ? product.images[0]
    : "https://placehold.co/400x300?text=No+Image"

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div 
        className="cursor-pointer" 
        onClick={navigateToProduct}
      >
        <div className="aspect-square relative">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-medium truncate">{product.name}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {product.description}
            </p>
            <p className="font-semibold">${product.price.toFixed(2)}</p>
          </div>
        </CardContent>
      </div>
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          className="w-full"
          disabled={loading}
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
      </CardFooter>
    </Card>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square relative bg-muted">
        <Skeleton className="h-full w-full" />
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-5 w-1/4" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  )
}