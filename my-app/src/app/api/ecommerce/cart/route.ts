import { NextRequest, NextResponse } from "next/server";
import {getServerSession}  from "next-auth/next";


import { prisma } from "@/lib/prisma";

import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { productId, quantity = 1 } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Check if product exists and is in stock
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        inStock: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or out of stock" },
        { status: 404 }
      );
    }

    // Check if item already exists in cart
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        userId: session.user.id,
        productId,
      },
    });

    if (existingCartItem) {
      // Update quantity
      const updatedCartItem = await prisma.cartItem.update({
        where: {
          id: existingCartItem.id,
        },
        data: {
          quantity: existingCartItem.quantity + quantity,
        },
        include: {
          product: true,
        },
      });

      return NextResponse.json(updatedCartItem);
    }

    // Create new cart item
    const cartItem = await prisma.cartItem.create({
      data: {
        userId: session.user.id,
        productId,
        quantity,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(cartItem);
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}