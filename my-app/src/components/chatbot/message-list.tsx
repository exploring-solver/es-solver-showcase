"use client"

import * as React from "react"
import { useEffect, useRef } from "react"
import { Message } from "@prisma/client"
import { MessageItem } from "./message-item"

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
}

export function MessageList({ messages, isLoading = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when messages change or loading state changes
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  return (
    <div className="flex flex-col overflow-y-auto p-4">
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <div className="text-center">
            <h3 className="text-lg font-semibold">No messages yet</h3>
            <p className="text-sm text-muted-foreground">
              Start a conversation or upload a document to begin.
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
          
          {isLoading && (
            <MessageItem
              message={{
                id: "loading",
                content: "",
                role: "ASSISTANT",
                conversationId: "",
                createdAt: new Date(),
              }}
              isLoading={true}
            />
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}