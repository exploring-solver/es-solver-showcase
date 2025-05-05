import { Metadata } from "next"
import { redirect } from "next/navigation"
import getServerSession  from "next-auth"
import Link from "next/link"

import { authOptions } from "../../../../../lib/auth"
import { Button } from "@/components/ui/button"
import { CheckCircle, Home, ShoppingBag } from "lucide-react"

export const metadata: Metadata = {
  title: "Order Successful",
  description: "Your order has been placed successfully",
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  const { orderId } = searchParams

  if (!orderId) {
    redirect("/module/ecommerce")
  }

  return (
    <div className="max-w-md mx-auto mt-8 text-center">
      <div className="rounded-full size-20 bg-green-100 dark:bg-green-900/20 mx-auto flex items-center justify-center">
        <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-500" />
      </div>
      
      <h1 className="mt-6 text-2xl font-bold">Order Successful!</h1>
      
      <p className="mt-3 text-muted-foreground">
        Thank you for your purchase. Your order has been processed successfully.
      </p>
      
      <div className="mt-4 p-4 rounded border bg-muted/50">
        <p className="text-sm">Order Reference</p>
        <p className="font-medium">{orderId}</p>
      </div>
      
      <p className="mt-6 text-sm text-muted-foreground">
        A confirmation email has been sent to your registered email address.
      </p>
      
      <div className="mt-8 flex flex-col gap-3">
        <Button asChild>
          <Link href="/module/ecommerce">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
        
        <Button variant="outline" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Return to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}