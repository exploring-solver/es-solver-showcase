import { Metadata } from "next"
import { notFound } from "next/navigation"
import  {getServerSession}  from "next-auth/next"

import { authOptions } from "../../../../../lib/auth"
import { prisma } from "@/lib/prisma";

import { NoteView } from "@/components/notes/note-view"

interface SharedNotePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params,
}: SharedNotePageProps): Promise<Metadata> {
  const {id} = await params; // wait for the id to resolve
  const note = await prisma.note.findUnique({
    where: {
      id: id,
      isPublic: true,
    },
  })

  if (!note) {
    return {
      title: "Note Not Found",
    }
  }

  return {
    title: note.title,
    description: "Shared note",
  }
}

export default async function SharedNotePage({ params }: SharedNotePageProps) {
  const session = await getServerSession(authOptions)
  
  const note = await prisma.note.findUnique({
    where: {
      id: params.id,
      isPublic: true,
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

  if (!note) {
    notFound()
  }

  // Check if the user is the owner of the note
  const isOwner = session && note.userId === session.user?.id;

  return (
    <div className="container py-6">
      <NoteView note={note} isOwner={isOwner} />
    </div>
  )
}