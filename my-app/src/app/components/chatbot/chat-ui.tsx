"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Message } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { SendHorizontal, Loader2, FileText } from "lucide-react"
import { MessageList } from "./message-list"
import { FileUpload } from "./file-upload"
import { toast } from "sonner"

interface ChatUIProps {
  conversationId: string
  initialMessages?: Message[]
}

export function ChatUI({ conversationId, initialMessages = [] }: ChatUIProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    // Set initial messages if provided
    if (initialMessages.length > 0) {
      setMessages(initialMessages)
    }
    
    // Fetch conversation documents
    fetchDocuments()
  }, [initialMessages, conversationId])

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/chatbot/conversation/${conversationId}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch conversation")
      }
      
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "USER",
      conversationId,
      createdAt: new Date(),
    }
    
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/chatbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          conversationId,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to send message")
      }
      
      // Read the streamed response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let responseText = ""
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          responseText += chunk
          
          // Update AI message in real-time
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            content: responseText,
            role: "ASSISTANT",
            conversationId,
            createdAt: new Date(),
          }
          
          setMessages((prev) => {
            // Replace or add the assistant message
            const hasAssistantMessage = prev.some(
              (msg) => msg.id === assistantMessage.id
            )
            
            if (hasAssistantMessage) {
              return prev.map((msg) =>
                msg.id === assistantMessage.id ? assistantMessage : msg
              )
            } else {
              return [...prev.filter((msg) => msg.role !== "ASSISTANT" || msg.id !== "loading"), assistantMessage]
            }
          })
        }
      }
      
      // Refresh the conversation to get the updated messages with citations
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleUploadComplete = (document: any) => {
    setDocuments((prev) => [...prev, document])
    
    // Add a system message about the document upload
    const systemMessage: Message = {
      id: Date.now().toString(),
      content: `Document "${document.name}" has been uploaded and processed. You can now ask questions about it.`,
      role: "SYSTEM",
      conversationId,
      createdAt: new Date(),
    }
    
    setMessages((prev) => [...prev, systemMessage])
  }

  return (
    <Card className="flex h-[calc(100vh-12rem)] flex-col">
      <CardContent className="flex-1 overflow-hidden p-0">
        <MessageList messages={messages} isLoading={isLoading} />
      </CardContent>
      
      <CardFooter className="flex flex-col gap-4 p-4">
        {documents.length > 0 && (
          <div className="w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <FileText className="h-4 w-4" />
              <span>Documents: {documents.length}</span>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 w-full">
          <FileUpload 
            conversationId={conversationId} 
            onUploadComplete={handleUploadComplete}
          />
          
          <div className="relative flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Ask a question about your documents..."
              className="pr-12 resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="absolute right-2 top-1"
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}