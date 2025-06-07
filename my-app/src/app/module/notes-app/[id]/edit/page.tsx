import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../../../../lib/auth";
import { Editor } from "@/components/notes/editor";

export const metadata: Metadata = {
  title: "Edit Note",
  description: "Edit your note",
};

interface EditNotePageProps {
  params: {
    id: string;
  };
}

export default async function EditNotePage(context: Promise<EditNotePageProps>) {
  const { params } = await context;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/sign-in");
  }

  const note = await prisma.note.findUnique({
    where: {
      id: params.id,
      userId: session.user?.id,
    },
  });

  if (!note) {
    redirect("/module/notes-app");
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Edit Note</h1>
      <Editor note={note} isEditing />
    </div>
  );
}