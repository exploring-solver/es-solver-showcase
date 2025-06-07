import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import {getServerSession}  from "next-auth/next"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma";

import { AdminProductForm } from "@/components/ecommerce/admin-product-form"

export const metadata: Metadata = {
  title: "Edit Product",
  description: "Edit product details",
}

interface EditProductPageProps {
  params: {
    id: string
  }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  // Check if user is admin
  if (session.user.role !== "ADMIN") {
    redirect("/module/ecommerce")
  }
  const { id } = params;
  const product = await prisma.product.findUnique({
    where: {
      id,
    },
  })

  if (!product) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
        <p className="text-muted-foreground">
          Update product information
        </p>
      </div>
      
      <AdminProductForm product={product} />
    </div>
  )
}