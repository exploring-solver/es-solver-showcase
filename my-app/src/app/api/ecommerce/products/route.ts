import { NextRequest, NextResponse } from "next/server";
import {getServerSession} from "next-auth/next";

import { prisma } from "@/lib/prisma";

import { authOptions } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    const query: any = {
      where: {},
      take: limit,
      skip,
      orderBy: {
        createdAt: "desc",
      },
    };

    // Add category filter if provided
    if (category) {
      query.where.category = category;
    }

    const [products, count] = await Promise.all([
      prisma.product.findMany(query),
      prisma.product.count({ where: query.where }),
    ]);

    return NextResponse.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, description, price, images, category } = await req.json();

    // Validate required fields
    if (!name || !description || !price || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        images: images || [],
        category,
        inStock: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}