import { NextRequest, NextResponse } from "next/server";
import {getServerSession}  from "next-auth/next"
import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { authOptions } from "../../../../lib/auth";

interface Params {
  params: {
    id: string;
  };
}

const noteUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    const noteId = params.id;

    // Check if the note exists
    const note = await prisma.note.findUnique({
      where: {
        id: noteId,
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

    if (!note) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    // If the note is not public and the user is not the owner
    if (!note.isPublic && (!session || note.userId !== session.user?.id)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json(
      { error: "Failed to fetch note" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const noteId = params.id;
    
    // Check if the note exists and belongs to the user
    const existingNote = await prisma.note.findUnique({
      where: {
        id: noteId,
        userId: session.user?.id,
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Note not found or unauthorized" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = noteUpdateSchema.parse(body);

    const updatedNote = await prisma.note.update({
      where: {
        id: noteId,
      },
      data: {
        title: validatedData.title ?? existingNote.title,
        content: validatedData.content ?? existingNote.content,
        isPublic: validatedData.isPublic ?? existingNote.isPublic,
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const noteId = params.id;
    
    // Check if the note exists and belongs to the user
    const existingNote = await prisma.note.findUnique({
      where: {
        id: noteId,
        userId: session.user?.id,
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Note not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.note.delete({
      where: {
        id: noteId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
