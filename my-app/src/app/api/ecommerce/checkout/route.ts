import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import Razorpay from "razorpay";

import { authOptions } from "../../../../lib/auth";
import { prisma } from "@/lib/prisma";

// Initialize Razorpay with your key_id and key_secret
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: userId,
      },
      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Calculate total
    const total = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    // Create order in your database
    const order = await prisma.order.create({
      data: {
        userId: userId,
        total,
        status: "PENDING",
        orderItems: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
    });

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // Convert to smallest currency unit (paise)
      currency: "INR", // Use INR for Indian Rupees
      receipt: `order_${order.id}`,
      notes: {
        orderId: order.id.toString(),
      },
    });

    // Update order with Razorpay order ID
    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentId: razorpayOrder.id,
      },
    });

    // Return the necessary information for the frontend
    return NextResponse.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}