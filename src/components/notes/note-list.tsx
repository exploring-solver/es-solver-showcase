"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { NoteCard } from "./note-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, FileText, Earth, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface NoteListProps {
  initialNotes?: any[]
  initialPublicNotes?: any[]
}

export function NoteList({ initialNotes = [], initialPublicNotes = [] }: NoteListProps) {
  const router = useRouter()
  const [notes, setNotes] = React.useState(initialNotes)
  const [publicNotes, setPublicNotes] = React.useState(initialPublicNotes)
  const [loading, setLoading] = React.useState(!initialNotes.length)
  const [publicLoading, setPublicLoading] = React.useState(!initialPublicNotes.length)
  const [activeTab, setActiveTab] = React.useState("my-notes")

  React.useEffect(() => {
    if (!initialNotes.length) {
      fetchNotes()
    }
    
    if (!initialPublicNotes.length && activeTab === "public") {
      fetchPublicNotes()
    }
  }, [initialNotes.length, initialPublicNotes.length, activeTab])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/notes")
      
      if (!response.ok) {
        throw new Error("Failed to fetch notes")
      }
      
      const data = await response.json()
      setNotes(data)
    } catch (error) {
      console.error("Error fetching notes:", error)
      toast.error(
        "Failed to load notes. Please try again.",
      )
    } finally {
      setLoading(false)
    }
  }

  const fetchPublicNotes = async () => {
    setPublicLoading(true)
    try {
      const response = await fetch("/api/notes/public")
      
      if (!response.ok) {
        throw new Error("Failed to fetch public notes")
      }
      
      const data = await response.json()
      setPublicNotes(data)
    } catch (error) {
      console.error("Error fetching public notes:", error)
      toast.error("Failed to load public notes. Please try again.")
    } finally {
      setPublicLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "public" && !publicNotes.length) {
      fetchPublicNotes()
    }
  }

  const handleNewNote = () => {
    router.push("/module/notes-app/new")
  }

  return (
    <Tabs defaultValue="my-notes" onValueChange={handleTabChange}>
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="my-notes" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            My Notes
          </TabsTrigger>
          <TabsTrigger value="public" className="flex items-center gap-1">
            <Earth className="h-4 w-4" />
            Public Notes
          </TabsTrigger>
        </TabsList>
        <Button onClick={handleNewNote}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>
      
      <TabsContent value="my-notes">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Notes Yet</CardTitle>
              <CardDescription>
                Create your first note to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground text-center">
                  You haven't created any notes yet. Click the button below to create your first note.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleNewNote} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Note
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/module/notes-app/${note.id}`}
                className="block h-full"
              >
                <NoteCard note={note} />
              </Link>
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="public">
        {publicLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : publicNotes.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Public Notes Found</CardTitle>
              <CardDescription>
                There are no public notes available at the moment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Earth className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground text-center">
                  When users make their notes public, they will appear here. You can make your own notes public by toggling the option when editing a note.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicNotes.map((note) => (
              <Link
                key={note.id}
                href={`/module/notes-app/shared/${note.id}`}
                className="block h-full"
              >
                <NoteCard note={note} isShared={true} />
              </Link>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}