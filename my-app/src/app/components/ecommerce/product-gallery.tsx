"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ProductGalleryProps {
  images: string[]
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)

  // Default image if no images are provided
  const validImages = images && images.length > 0
    ? images
    : ["https://placehold.co/600x400?text=No+Image"]

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % validImages.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <Image
          src={validImages[currentIndex]}
          alt="Product image"
          fill
          className="object-cover"
          priority
        />
        
        {validImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/80"
              onClick={prevImage}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous image</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/80"
              onClick={nextImage}
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next image</span>
            </Button>
          </>
        )}
      </div>
      
      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-auto pb-2">
          {validImages.map((image, index) => (
            <button
              key={index}
              className={cn(
                "relative h-16 w-16 rounded-md overflow-hidden",
                currentIndex === index && "ring-2 ring-primary"
              )}
              onClick={() => setCurrentIndex(index)}
            >
              <Image
                src={image}
                alt={`Product thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
