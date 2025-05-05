"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Edit, Trash, User } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface NoteViewProps {
  note: {
    id: string
    title: string
    content: string
    isPublic: boolean
    createdAt: Date
    updatedAt: Date
    userId: string
    user?: {
      name: string | null
      email: string | null
    }
  }
  isOwner: boolean
}

export function NoteView({ note, isOwner }: NoteViewProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    if (!isOwner) return
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete note")
      }
      
      toast("Note deleted",{
        description: "Your note has been deleted successfully",
      })
      
      // Redirect to notes list
      router.push("/module/notes-app")
      router.refresh()
    } catch (error) {
      console.error("Error deleting note:", error)
      toast.error("Failed to delete note. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-start">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="mb-2 -ml-2"
            >
              <Link href="/module/notes-app">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Notes
              </Link>
            </Button>
            <CardTitle className="text-2xl">{note.title}</CardTitle>
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/module/notes-app/${note.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-500">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Note</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this note? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="mr-1 h-4 w-4" />
            {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
          </div>
          {note.user && (
            <div className="flex items-center">
              <User className="mr-1 h-4 w-4" />
              {note.user.name || note.user.email}
            </div>
          )}
          {note.isPublic && (
            <Badge variant="outline">Public</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      </CardContent>
      {!isOwner && (
        <CardFooter className="border-t">
          <p className="text-sm text-muted-foreground">
            This is a shared note created by another user.
          </p>
        </CardFooter>
      )}
    </Card>
  )
}