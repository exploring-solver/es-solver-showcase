import { Metadata } from "next"
import { redirect } from "next/navigation"
import getServerSession  from "next-auth"

import { authOptions } from "../../../lib/auth"
import { prisma } from "@/lib/prisma";

import { ProductList } from "@/components/ecommerce/product-list"

export const metadata: Metadata = {
  title: "E-Commerce Store",
  description: "Browse and purchase products",
}

export default async function EcommercePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  // Get products for initial render
  const products = await prisma.product.findMany({
    take: 9,
    orderBy: {
      createdAt: "desc",
    },
  })

  // Get total count for pagination
  const totalCount = await prisma.product.count()
  const totalPages = Math.ceil(totalCount / 9)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Browse our collection of products
        </p>
      </div>
      
      <ProductList initialProducts={products} initialTotalPages={totalPages} />
    </div>
  )
}
