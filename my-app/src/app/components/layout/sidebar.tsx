"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  MessageSquare, 
  ShoppingCart, 
  FileText, 
  Home, 
  LayoutDashboard 
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/module/ai-chatbot",
      label: "AI Chatbot",
      icon: MessageSquare,
      active: pathname?.startsWith("/module/ai-chatbot"),
    },
    {
      href: "/module/ecommerce",
      label: "E-Commerce",
      icon: ShoppingCart,
      active: pathname?.startsWith("/module/ecommerce"),
    },
    {
      href: "/module/notes-app",
      label: "Notes App",
      icon: FileText,
      active: pathname?.startsWith("/module/notes-app"),
    },
  ]

  return (
    <div className="h-full flex flex-col py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">ES Solver Showcase</h2>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
                route.active ? "bg-muted text-primary" : "text-muted-foreground"
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}