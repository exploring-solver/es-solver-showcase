import { NextRequest, NextResponse } from "next/server";
import {getServerSession}  from "next-auth/next";


import { prisma } from "@/lib/prisma";

import { authOptions } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [products, orders, users] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
    ]);

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
    });

    return NextResponse.json({
      products,
      orders,
      users,
      recentOrders,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}