import { Metadata } from "next"
import { redirect } from "next/navigation"
import  getServerSession  from "next-auth"

import { authOptions } from "../../../../lib/auth"
import { Editor } from "@/components/notes/editor"

export const metadata: Metadata = {
  title: "New Note",
  description: "Create a new note",
}

export default async function NewNotePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <div className="container max-w-4xl py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Create New Note</h1>
      <Editor />
    </div>
  )
}

