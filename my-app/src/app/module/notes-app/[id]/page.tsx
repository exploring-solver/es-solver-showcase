import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import  { getServerSession }  from "next-auth/next"

import { authOptions } from "../../../../lib/auth"
import { prisma } from "@/lib/prisma";

import { NoteView } from "@/components/notes/note-view"

interface NotePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params,
}: NotePageProps): Promise<Metadata> {
  const { id } = await params; // wait for the id to resolve

const note = await prisma.note.findUnique({
  where: {
    id,
  },
});

  if (!note) {
    return {
      title: "Note Not Found",
    }
  }
  
  return {
    title: note.title,
    description: "View note",
  }
}

export default async function NotePage({ params }: NotePageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/sign-in")
  }
  const { id } = await params;
  const note = await prisma.note.findUnique({
    where: {
      id: id,
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
  const isOwner = note.userId === session.user?.id

  // If the note is not public and the user is not the owner, redirect to the notes list
  if (!note.isPublic && !isOwner) {
    redirect("/module/notes-app")
  }

  return (
    <div className="container py-6">
      <NoteView note={note} isOwner={isOwner} />
    </div>
  )
}