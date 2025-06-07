"use client"

import React from 'react'
import { Plus, MessageSquare, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Conversation {
  id: string
  title: string
  createdAt: string
  messageCount: number
  updatedAt?: string
}

interface ConversationListProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  onRenameConversation?: (id: string, newTitle: string) => void
  isLoading?: boolean
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  isLoading = false
}: ConversationListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="h-full flex flex-col bg-muted/10">
      {/* Header */}
      <div className="p-4 border-b">
        <Button 
          onClick={onNewConversation}
          className="w-full justify-start"
          size="sm"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>
      
      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div key={conversation.id}>
                  <Card
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:bg-muted/50 group relative",
                      activeConversationId === conversation.id 
                        ? 'bg-primary/10 border-primary/20 shadow-sm' 
                        : 'hover:shadow-sm'
                    )}
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <h3 className="font-medium text-sm truncate leading-tight">
                              {conversation.title}
                            </h3>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <span>{conversation.messageCount}</span>
                              <span>messages</span>
                            </span>
                            <div className="flex flex-col items-end space-y-1">
                              <span>{formatDate(conversation.createdAt)}</span>
                              {conversation.updatedAt && (
                                <span className="text-[10px]">
                                  {formatTime(conversation.updatedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onRenameConversation && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const newTitle = prompt('Enter new title:', conversation.title)
                                  if (newTitle && newTitle.trim()) {
                                    onRenameConversation(conversation.id, newTitle.trim())
                                  }
                                }}
                              >
                                Rename
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Are you sure you want to delete this conversation?')) {
                                  onDeleteConversation(conversation.id)
                                }
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Active indicator */}
                      {activeConversationId === conversation.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
          
          {/* Empty State */}
          {!isLoading && conversations.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-sm mb-2">No conversations yet</h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Start a new conversation to begin chatting with the AI assistant
              </p>
              <Button 
                onClick={onNewConversation} 
                size="sm" 
                variant="outline"
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Create First Chat
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Footer Stats */}
      {conversations.length > 0 && (
        <div className="p-4 border-t bg-muted/20">
          <div className="text-xs text-muted-foreground text-center">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}