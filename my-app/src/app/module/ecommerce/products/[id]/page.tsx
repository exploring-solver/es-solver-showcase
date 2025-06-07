import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import  getServerSession  from "next-auth"

import { authOptions } from "../../../../../lib/auth"
import { prisma } from "@/lib/prisma";

import { Button } from "@/components/ui/button"
import { ProductGallery } from "@/components/ecommerce/product-gallery"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { AddToCartButton } from "@/components/ecommerce/add-to-cart-button"
interface ProductPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: {
      id: params.id,
    },
  })

  if (!product) {
    return {
      title: "Product Not Found",
    }
  }

  return {
    title: product.name,
    description: product.description,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  const product = await prisma.product.findUnique({
    where: {
      id: params.id,
    },
  })

  if (!product) {
    notFound()
  }

  // Get related products (same category)
  const relatedProducts = await prisma.product.findMany({
    where: {
      category: product.category,
      id: {
        not: product.id,
      },
    },
    take: 4,
  })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <Link
          href="/module/ecommerce"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Products
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm">{product.name}</span>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={product.images} />
        
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-2xl font-semibold mt-2">${product.price.toFixed(2)}</p>
          </div>
          
          <Separator />
          
          <div className="prose dark:prose-invert">
            <p>{product.description}</p>
          </div>
          
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className={product.inStock ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                {product.inStock ? "In Stock" : "Out of Stock"}
              </span>
            </div>
            
            <AddToCartButton 
              productId={product.id} 
              disabled={!product.inStock} 
            />
          </div>
          
          <Separator className="my-4" />
          
          <div>
            <h2 className="font-semibold">Product Details</h2>
            <dl className="mt-4 space-y-4">
              <div className="flex gap-4">
                <dt className="w-32 font-medium text-muted-foreground">Category</dt>
                <dd>{product.category}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-32 font-medium text-muted-foreground">ID</dt>
                <dd className="text-sm">{product.id}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      
      {relatedProducts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold">Related Products</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            {relatedProducts.map((product) => (
              <div
                key={product.id}
                className="group relative overflow-hidden rounded-lg border"
              >
                <Link href={`/module/ecommerce/products/${product.id}`}>
                  <div className="aspect-square bg-gray-100 relative">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-muted">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium">{product.name}</h3>
                    <p className="mt-1 text-sm font-medium">${product.price.toFixed(2)}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

