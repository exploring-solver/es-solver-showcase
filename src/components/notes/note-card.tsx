import * as React from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, User } from "lucide-react"

interface NoteCardProps {
  note: {
    id: string
    title: string
    content: string
    isPublic: boolean
    updatedAt: Date
    user?: {
      name: string | null
      email: string | null
    }
  }
  isShared?: boolean
}

export function NoteCard({ note, isShared = false }: NoteCardProps) {
  // Extract the first few words from the content
  const contentPreview = React.useMemo(() => {
    // Remove HTML tags to get plain text
    const plainText = note.content.replace(/<[^>]*>?/gm, '')
    const words = plainText.split(' ')
    return words.slice(0, 20).join(' ') + (words.length > 20 ? '...' : '')
  }, [note.content])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="truncate">{note.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-4">
          {contentPreview}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <FileText className="mr-1 h-3 w-3" />
          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
        </div>
        <div className="flex items-center gap-2">
          {note.isPublic && (
            <Badge variant="outline" className="text-xs">
              Public
            </Badge>
          )}
          {isShared && note.user && (
            <div className="flex items-center text-xs text-muted-foreground">
              <User className="mr-1 h-3 w-3" />
              {note.user.name || note.user.email}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

