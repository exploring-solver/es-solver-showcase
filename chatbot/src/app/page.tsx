"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConversationList } from '@/components/conversation-list'
import { MessageDisplay } from '@/components/message-display'
import { ChatInput } from '@/components/chat-input'
import { FileUpload } from '@/components/file-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload, Brain, FileText, MessageSquare, AlertTriangle } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: string
  citations?: Citation[]
}

interface Citation {
  id: string
  content: string
  filename: string
  pageNumber?: number
}

interface Conversation {
  id: string
  title: string
  createdAt: string
  messageCount: number
}

// Simple toast function (replace with your preferred toast library)
const toast = (options: { title?: string; description: string; variant?: string }) => {
  console.log(`${options.title}: ${options.description}`)
  // You can implement a proper toast here or install react-hot-toast
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: 'success' | 'error' }>({})
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast({ description: "Failed to load conversations", variant: "destructive" })
    }
  }

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' })
      })
      const data = await response.json()
      
      if (data.conversation) {
        setConversations(prev => [data.conversation, ...prev])
        setActiveConversationId(data.conversation.id)
        setMessages([])
        setError(null)
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      toast({ description: "Failed to create new conversation", variant: "destructive" })
    }
  }

  const selectConversation = async (conversationId: string) => {
    try {
      setActiveConversationId(conversationId)
      setError(null)
      
      const response = await fetch(`/api/conversations/${conversationId}`)
      const data = await response.json()
      
      setMessages(data.conversation?.messages || [])
    } catch (error) {
      console.error('Error loading conversation:', error)
      toast({ description: "Failed to load conversation", variant: "destructive" })
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE'
      })
      
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      
      if (activeConversationId === conversationId) {
        setActiveConversationId(null)
        setMessages([])
      }
      
      toast({ description: "Conversation deleted" })
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast({ description: "Failed to delete conversation", variant: "destructive" })
    }
  }

  const sendMessage = async (message: string) => {
    if (!activeConversationId) {
      await createNewConversation()
      // Wait a bit for the conversation to be created
      setTimeout(() => sendMessage(message), 100)
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      createdAt: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)
    setError(null)

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId: activeConversationId
        })
      })

      if (response.status === 429) {
        setError('Rate limit exceeded. Please wait a moment before sending another message.')
        setIsTyping(false)
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''
      let assistantMessageId = Date.now().toString()

      // Add initial assistant message
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        createdAt: new Date().toISOString(),
      }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'chunk' && data.content) {
                assistantMessage += data.content
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: assistantMessage }
                    : msg
                ))
              }
              
              if (data.type === 'done') {
                setIsTyping(false)
                loadConversations() // Refresh conversation list
              }
              
              if (data.type === 'error') {
                setError(data.error || 'An error occurred')
                setIsTyping(false)
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setIsTyping(false)
      setError('Failed to send message. Please try again.')
    }
  }

  const handleFileUpload = async (files: File[]) => {
    if (!activeConversationId) {
      toast({ description: "Please create a conversation first", variant: "destructive" })
      return
    }

    setIsUploading(true)
    setUploadProgress({})
    setUploadedFiles({})

    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    formData.append('conversationId', activeConversationId)

    // Simulate upload progress
    files.forEach(file => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 20
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
        }
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
      }, 200)
    })

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        const fileStatuses: { [key: string]: 'success' | 'error' } = {}
        data.files.forEach((file: any) => {
          fileStatuses[file.filename] = file.status
        })
        setUploadedFiles(fileStatuses)

        const successCount = data.files.filter((f: any) => f.status === 'success').length
        toast({ description: `${successCount} files uploaded successfully` })

        setTimeout(() => {
          setIsUploadOpen(false)
        }, 2000)
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      toast({ description: "Failed to upload files", variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold">AI RAG Chatbot</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadOpen(true)}
              disabled={!activeConversationId}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <Alert className="mx-6 mt-4" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <div className="h-full border-r">
              <ConversationList
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={selectConversation}
                onNewConversation={createNewConversation}
                onDeleteConversation={deleteConversation}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Main Chat Area */}
          <ResizablePanel defaultSize={75}>
            <div className="h-full flex flex-col min-h-0">
              {activeConversationId ? (
                <>
                  {/* Messages */}
                  <ScrollArea className="h-full flex-1 min-h-0 p-4">
                    <div className="max-w-4xl mx-auto space-y-4">
                      <MessageDisplay messages={messages} isTyping={isTyping} />
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Chat Input */}
                  <ChatInput
                    onSendMessage={sendMessage}
                    onAttachFile={() => setIsUploadOpen(true)}
                    disabled={isTyping}
                  />
                </>
              ) : (
                /* Welcome Screen */
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-md">
                    <div className="space-y-6">
                      <Brain className="h-16 w-16 mx-auto text-primary" />
                      <h2 className="text-2xl font-bold">Welcome to AI RAG Chatbot</h2>
                      <p className="text-muted-foreground">
                        Upload your documents and start asking questions. The AI will provide
                        answers based on your uploaded content with proper citations.
                      </p>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <Card>
                          <CardContent className="p-4 flex items-center space-x-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <div className="text-left">
                              <h3 className="font-medium">Document Upload</h3>
                              <p className="text-sm text-muted-foreground">
                                Support for PDF, DOCX, TXT, and CSV files
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4 flex items-center space-x-3">
                            <MessageSquare className="h-8 w-8 text-primary" />
                            <div className="text-left">
                              <h3 className="font-medium">Smart Conversations</h3>
                              <p className="text-sm text-muted-foreground">
                                AI-powered responses with source citations
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Button onClick={createNewConversation} size="lg">
                        Start New Conversation
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
          </DialogHeader>
          <FileUpload
            onFileUpload={handleFileUpload}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            uploadedFiles={uploadedFiles}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
