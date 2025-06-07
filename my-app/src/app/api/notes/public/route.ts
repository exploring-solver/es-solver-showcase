import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";


export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const userId = searchParams.get("userId");
    
    const query: any = {
      where: {
        isPublic: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    };
    
    // Add userId filter if provided
    if (userId) {
      query.where.userId = userId;
    }

    const notes = await prisma.note.findMany(query);

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching public notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch public notes" },
      { status: 500 }
    );
  }
}