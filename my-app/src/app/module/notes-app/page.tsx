import { Metadata } from "next"
import { redirect } from "next/navigation"
import  getServerSession  from "next-auth"

import { authOptions } from "../../../lib/auth"
import { prisma } from "@/lib/prisma";

import { NoteList } from "@/components/notes/note-list"

export const metadata: Metadata = {
  title: "Notes App",
  description: "Create, edit, and share notes",
}

export default async function NotesAppPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  // Get user's notes for initial render
  const notes = await prisma.note.findMany({
    where: {
      userId: session.user?.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  // Get public notes for initial render
  const publicNotes = await prisma.note.findMany({
    where: {
      isPublic: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 10,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
        <p className="text-muted-foreground">
          Create, edit, and share your notes with others
        </p>
      </div>
      
      <NoteList initialNotes={notes} initialPublicNotes={publicNotes} />
    </div>
  )
}