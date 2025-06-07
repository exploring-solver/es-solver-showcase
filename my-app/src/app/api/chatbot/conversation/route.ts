import { NextRequest, NextResponse } from "next/server";
import {getServerSession}  from "next-auth/next";

import { prisma } from "@/lib/prisma";

import { authOptions } from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("POST /api/chatbot/conversation - session:", session);

    if (!session) {
      console.log("POST /api/chatbot/conversation - Unauthorized");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { title } = await req.json();
    console.log("POST /api/chatbot/conversation - title:", title);

    const conversation = await prisma.conversation.create({
      data: {
        title: title || "New Conversation",
        userId: session.user?.id,
      },
    });

    console.log("POST /api/chatbot/conversation - created:", conversation);
    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("GET /api/chatbot/conversation - session:", session);

    if (!session) {
      console.log("GET /api/chatbot/conversation - Unauthorized");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: session.user?.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    console.log("GET /api/chatbot/conversation - found:", conversations.length);
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
