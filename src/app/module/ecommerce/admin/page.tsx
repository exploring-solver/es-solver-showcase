import { Metadata } from "next"
import { redirect } from "next/navigation"
import {getServerSession}  from "next-auth/next"

import { authOptions } from "../../../../lib/auth"
import { prisma } from "@/lib/prisma";

import { AdminDashboard } from "@/components/ecommerce/admin-dashboard"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "E-commerce store administration",
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  console.log("AdminPage: session", session);

  if (!session) {
    console.log("AdminPage: No session, redirecting to /sign-in");
    redirect("/sign-in")
  }

  // Check if user is admin
  if (session.user.role !== "ADMIN") {
    console.log("AdminPage: User is not admin, redirecting to /module/ecommerce");
    redirect("/module/ecommerce")
  }

  // Get admin dashboard data
  const [products, orders, users] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
  ])

  // Get recent orders
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  console.log("AdminPage: Dashboard counts", { products, orders, users });
  console.log("AdminPage: Recent orders", recentOrders);

  const adminData = {
    products,
    orders,
    users,
    recentOrders,
  }

  return (
    <AdminDashboard initialData={adminData} />
  )
}