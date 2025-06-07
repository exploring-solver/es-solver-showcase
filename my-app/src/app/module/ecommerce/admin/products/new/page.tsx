import { Metadata } from "next"
import { redirect } from "next/navigation"
import {getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../../lib/auth"
import { AdminProductForm } from "@/components/ecommerce/admin-product-form"

export const metadata: Metadata = {
  title: "Add Product",
  description: "Add a new product to your store",
}

export default async function AddProductPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  // Check if user is admin
  if (session.user.role !== "ADMIN") {
    redirect("/module/ecommerce")
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
        <p className="text-muted-foreground">
          Create a new product for your store
        </p>
      </div>
      
      <AdminProductForm />
    </div>
  )
}