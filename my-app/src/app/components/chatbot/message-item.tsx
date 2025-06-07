import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { Message } from "@prisma/client"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, User } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface MessageItemProps {
  message: Message
  isLoading?: boolean
}

export function MessageItem({ message, isLoading = false }: MessageItemProps) {
  const isUser = message.role === "USER"

  return (
    <div
      className={cn(
        "flex w-full items-start gap-4 py-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10">
            <MessageCircle className="h-4 w-4 text-primary" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-2 rounded-lg px-4 py-3",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        )}
      >
        <div className="prose prose-sm dark:prose-invert">
          {isLoading ? (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 animate-bounce rounded-full bg-current"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:0.2s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:0.4s]"></div>
            </div>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>
        
        <div className="text-xs opacity-60">
          {isLoading ? "Thinking..." : formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </div>
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}