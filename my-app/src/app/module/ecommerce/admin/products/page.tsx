
import { Metadata } from "next"
import { redirect } from "next/navigation"
import {getServerSession}  from "next-auth/next"
import Link from "next/link"

import { authOptions } from "../../../../../lib/auth"
import { prisma } from "@/lib/prisma";
import { AdminDeleteButton } from "@/components/ecommerce/AdminDeleteButton"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { formatDistanceToNow } from "date-fns"
import { Edit, Plus, Trash } from "lucide-react"

export const metadata: Metadata = {
  title: "Admin Products",
  description: "Manage store products",
}

export default async function AdminProductsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  // Check if user is admin
  if (session.user.role !== "ADMIN") {
    redirect("/module/ecommerce")
  }

  const products = await prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your store products
          </p>
        </div>
        <Button asChild>
          <Link href="/module/ecommerce/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <span className={product.inStock ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </TableCell>
                  <TableCell>{formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/module/ecommerce/admin/products/${product.id}`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <AdminDeleteButton productId={product.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

