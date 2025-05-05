"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Button } from "@/components/ui/button"
import { MenuIcon } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar"
import { UserNav } from "./user-nav"
import Header from "./Header"

export function MainNav() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <div className="flex h-16 items-center px-4 border-b">
      <div className="hidden md:flex md:flex-1">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-xl">ES Solver</span>
        </Link>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/"
            className={cn(
              "transition-colors hover:text-primary",
              pathname === "/" ? "text-primary" : "text-muted-foreground"
            )}
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              "transition-colors hover:text-primary",
              pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/module/ai-chatbot"
            className={cn(
              "transition-colors hover:text-primary",
              pathname?.startsWith("/module/ai-chatbot") ? "text-primary" : "text-muted-foreground"
            )}
          >
            AI Chatbot
          </Link>
          <Link
            href="/module/ecommerce"
            className={cn(
              "transition-colors hover:text-primary",
              pathname?.startsWith("/module/ecommerce") ? "text-primary" : "text-muted-foreground"
            )}
          >
            E-Commerce
          </Link>
          <Link
            href="/module/notes-app"
            className={cn(
              "transition-colors hover:text-primary",
              pathname?.startsWith("/module/notes-app") ? "text-primary" : "text-muted-foreground"
            )}
          >
            Notes App
          </Link>
        </nav>
      </div>

      {/* Mobile menu button */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="outline" size="icon" className="mr-2">
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[80vw] sm:w-[350px]">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="md:hidden flex-1 flex justify-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl">ES Solver</span>
        </Link>
      </div>

      <div className="flex items-center justify-end space-x-3">
        <ThemeToggle />
        {/* <UserNav /> */}
        <Header/>
      </div>
    </div>
  )
}