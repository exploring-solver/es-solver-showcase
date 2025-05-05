"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash } from "lucide-react"
import { toast } from "sonner"

interface CartItemProps {
    item: {
        id: string
        quantity: number
        product: {
            id: string
            name: string
            price: number
            images: string[]
        }
    }
    onUpdate: () => void
}

export function CartItem({ item, onUpdate }: CartItemProps) {
    const [quantity, setQuantity] = React.useState(item.quantity)
    const [loading, setLoading] = React.useState(false)

    // Use a timeout to debounce updates
    React.useEffect(() => {
        if (quantity === item.quantity) return

        const timeout = setTimeout(() => {
            updateItemQuantity(quantity)
        }, 500)

        return () => clearTimeout(timeout)
    }, [quantity])

    const updateItemQuantity = async (newQuantity: number) => {
        if (newQuantity < 1) return

        setLoading(true)

        try {
            const response = await fetch(`/api/ecommerce/cart/${item.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    quantity: newQuantity,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to update cart")
            }

            onUpdate()
        } catch (error) {
            console.error("Error updating cart:", error)
            toast.error("Error", {
                description: "Failed to update cart. Please try again."
            })
            // Reset to previous quantity
            setQuantity(item.quantity)
        } finally {
            setLoading(false)
        }
    }

    const removeItem = async () => {
        setLoading(true)

        try {
            const response = await fetch(`/api/ecommerce/cart/${item.id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                throw new Error("Failed to remove item")
            }

            toast("Item removed",{
                description: "Item has been removed from your cart.",
            })

            onUpdate()
        } catch (error) {
            console.error("Error removing item:", error)
            toast.error("Error",{
                description: "Failed to remove item. Please try again.",
            })
        } finally {
            setLoading(false)
        }
    }

    // Placeholder image if no images are available
    const imageUrl = item.product.images && item.product.images.length > 0
        ? item.product.images[0]
        : "https://placehold.co/100x100?text=No+Image"

    return (
        <div className="flex items-center space-x-4 py-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-md">
                <Image
                    src={imageUrl}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                />
            </div>
            <div className="flex-1 space-y-1">
                <Link
                    href={`/module/ecommerce/products/${item.product.id}`}
                    className="font-medium hover:underline"
                >
                    {item.product.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                    ${item.product.price.toFixed(2)}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex w-20 items-center">
                    <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="h-8"
                        disabled={loading}
                    />
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={removeItem}
                    disabled={loading}
                >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                </Button>
            </div>
        </div>
    )
}
