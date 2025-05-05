"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Loader2, MessageSquare, Plus, Trash } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Conversation {
  id: string
  title: string
  updatedAt: Date
}

export function ConversationList() {
  const router = useRouter()
  const pathname = usePathname()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/chatbot/conversation")
      
      if (!response.ok) {
        throw new Error("Failed to fetch conversations")
      }
      
      const data = await response.json()
      setConversations(data)
    } catch (error) {
      console.error("Error fetching conversations:", error)
      toast.error("Failed to load conversations")
    } finally {
      setIsLoading(false)
    }
  }

  const createConversation = async () => {
    try {
      setIsCreating(true)
      const response = await fetch("/api/chatbot/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle || "New Conversation" }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to create conversation")
      }
      
      const newConversation = await response.json()
      
      setConversations((prev) => [newConversation, ...prev])
      setNewTitle("")
      
      // Navigate to the new conversation
      router.push(`/module/ai-chatbot/${newConversation.id}`)
    } catch (error) {
      console.error("Error creating conversation:", error)
      toast.error("Failed to create new conversation")
    } finally {
      setIsCreating(false)
    }
  }

  const deleteConversation = async () => {
    if (!deleteId) return
    
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/chatbot/conversation/${deleteId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete conversation")
      }
      
      setConversations((prev) => 
        prev.filter((conv) => conv.id !== deleteId)
      )
      
      toast.success("Conversation deleted")
      
      // If currently viewing the deleted conversation, redirect to main page
      if (pathname?.includes(deleteId)) {
        router.push("/module/ai-chatbot")
      }
    } catch (error) {
      console.error("Error deleting conversation:", error)
      toast.error("Failed to delete conversation")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleteId(id)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-4 py-2">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 gap-1">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Conversation</DialogTitle>
              <DialogDescription>
                Start a new chat conversation with AI
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Input
                  placeholder="Conversation title (optional)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createConversation} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="px-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/module/ai-chatbot/${conversation.id}`}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                  pathname?.includes(conversation.id) && "bg-muted"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{conversation.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(conversation.updatedAt), "MMM d")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDeleteClick(conversation.id, e)}
                  >
                    <Trash className="h-3.5 w-3.5" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteConversation}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}