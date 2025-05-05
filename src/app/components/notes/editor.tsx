"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Share } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface EditorProps {
  note?: {
    id?: string
    title: string
    content: string
    isPublic: boolean
  }
  isEditing?: boolean
}

export function Editor({ note, isEditing = false }: EditorProps) {
  const router = useRouter()
  const [title, setTitle] = React.useState(note?.title || "Untitled")
  const [isPublic, setIsPublic] = React.useState(note?.isPublic || false)
  const [loading, setLoading] = React.useState(false)
  const [isSaved, setIsSaved] = React.useState(false)
  const [showShareDialog, setShowShareDialog] = React.useState(false)
  const [shareUrl, setShareUrl] = React.useState("")
  
  // Auto-save timer
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: note?.content || "",
    autofocus: true,
    onUpdate: ({ editor }) => {
      // Clear any existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      
      // Set a new timer to save after 500ms of inactivity
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(false)
      }, 500)
      
      setIsSaved(false)
    },
  })

  React.useEffect(() => {
    // Clean up the timer when component unmounts
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  const handleSave = async (showToast = true) => {
    if (!editor || loading) return
    
    setLoading(true)
    
    try {
      const content = editor.getHTML()
      
      if (content.length < 1 || title.length < 1) {
        return
      }
      
      const noteData = {
        title,
        content,
        isPublic,
      }
      
      let response
      
      if (isEditing && note?.id) {
        // Update existing note
        response = await fetch(`/api/notes/${note.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(noteData),
        })
      } else {
        // Create new note
        response = await fetch("/api/notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(noteData),
        })
      }
      
      if (!response.ok) {
        throw new Error("Failed to save note")
      }
      
      const savedNote = await response.json()
      
      // If this is a new note, redirect to the edit page
      if (!isEditing) {
        router.push(`/module/notes-app/${savedNote.id}`)
      }
      
      setIsSaved(true)
      
      if (showToast) {
        toast("Note saved",{
          description: "Your note has been saved successfully",
        })
      }
      
      // Refresh the route to update note list
      router.refresh()
    } catch (error) {
      console.error("Error saving note:", error)
      if (showToast) {
        toast("Error",{
          description: "Failed to save note. Please try again.",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    if (!note?.id) return
    
    const url = `${window.location.origin}/module/notes-app/shared/${note.id}`
    setShareUrl(url)
    setShowShareDialog(true)
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast("Link copied",{
      description: "Share link has been copied to clipboard",
    })
    setShowShareDialog(false)
  }

  // Handle public toggle change
  const handlePublicToggle = (checked: boolean) => {
    setIsPublic(checked)
    
    // Save changes immediately when toggling public status
    if (editor && note?.id) {
      autoSaveTimerRef.current && clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(false)
      }, 100)
    }
  }

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-y-0">
        <div className="flex-1 sm:mr-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="text-xl font-semibold h-12"
          />
        </div>
        <div className="flex gap-2">
          {note?.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-12"
            >
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
          )}
          <Button 
            onClick={() => handleSave(true)} 
            disabled={loading}
            className="h-12"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isSaved ? "Saved" : "Save"}
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="public-mode"
          checked={isPublic}
          onCheckedChange={handlePublicToggle}
        />
        <Label htmlFor="public-mode">
          Make this note public
        </Label>
        {isPublic && (
          <span className="text-xs text-muted-foreground">
            (Anyone with the link can view)
          </span>
        )}
      </div>
      
      <div className="border rounded-md p-4 min-h-[400px]">
        <EditorContent editor={editor} className="prose dark:prose-invert max-w-none" />
      </div>
      
      {/* Share Dialog */}
      <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share Note</AlertDialogTitle>
            <AlertDialogDescription>
              {isPublic ? (
                <>
                  Anyone with this link can view your note.
                  <div className="mt-2 p-2 bg-muted rounded text-sm font-mono break-all">
                    {shareUrl}
                  </div>
                </>
              ) : (
                <>
                  This note is currently private. Make it public to share with others.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {isPublic ? (
              <AlertDialogAction onClick={copyShareLink}>
                Copy Link
              </AlertDialogAction>
            ) : (
              <Button 
                onClick={() => {
                  setIsPublic(true)
                  setShowShareDialog(false)
                  // Save changes with public set to true
                  if (editor && note?.id) {
                    setTimeout(() => {
                      handleSave(true)
                      // Reopen share dialog after saving
                      setTimeout(() => handleShare(), 500)
                    }, 100)
                  }
                }}
              >
                Make Public
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
