import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { prisma } from "@/lib/prisma";

import { authOptions } from "../../../../../lib/auth";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    console.log("GET /api/chatbot/conversation/[id] - session:", session, "params:", params);

    if (!session) {
      console.log("GET /api/chatbot/conversation/[id] - Unauthorized");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const conversation = await prisma.conversation.findUnique({
      where: {
        id,
        userId: session.user?.id,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
        documents: true,
      },
    });

    if (!conversation) {
      console.log("GET /api/chatbot/conversation/[id] - Not found");
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    console.log("GET /api/chatbot/conversation/[id] - found:", conversation.id);
    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: Promise<Params>) {
  try {
    const { params } = await context;
    const session = await getServerSession(authOptions);
    console.log("DELETE /api/chatbot/conversation/[id] - session:", session, "params:", params);

    if (!session) {
      console.log("DELETE /api/chatbot/conversation/[id] - Unauthorized");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: params.id,
        userId: session.user?.id,
      },
    });

    if (!conversation) {
      console.log("DELETE /api/chatbot/conversation/[id] - Not found");
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    await prisma.conversation.delete({
      where: {
        id: params.id,
      },
    });

    console.log("DELETE /api/chatbot/conversation/[id] - deleted:", params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}