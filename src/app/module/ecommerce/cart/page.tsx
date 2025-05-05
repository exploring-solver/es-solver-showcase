import { Metadata } from "next"
import { redirect } from "next/navigation"
import  {getServerSession}  from "next-auth/next"

import { authOptions } from "../../../../lib/auth"
import { prisma } from "@/lib/prisma";

import { Cart } from "@/components/ecommerce/cart"

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "View your shopping cart and checkout",
}

export default async function CartPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  // Get cart items for initial render
  const cartItems = await prisma.cartItem.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      product: true,
    },
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
        <p className="text-muted-foreground">
          Review your items and proceed to checkout
        </p>
      </div>
      
      <Cart initialCartItems={cartItems} />
    </div>
  )
}