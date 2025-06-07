'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Send, Clock, AlertTriangle } from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: string
}

interface ChatInterfaceProps {
  conversationId: string
  initialMessages?: Message[]
}

export function ChatInterface({ conversationId, initialMessages = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number
    resetTime: string
    retryAfter?: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      createdAt: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationId
        })
      })

      // Update rate limit info from headers
      const remaining = response.headers.get('X-Rate-Limit-Remaining')
      const resetTime = response.headers.get('X-Rate-Limit-Reset')
      if (remaining && resetTime) {
        setRateLimitInfo({
          remaining: parseInt(remaining),
          resetTime
        })
      }

      if (response.status === 429) {
        const errorData = await response.json()
        setError(errorData.message)
        setRateLimitInfo(prev => ({ 
          ...prev!, 
          retryAfter: errorData.retryAfter 
        }))
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      const assistantMsgId = Date.now().toString()
      setMessages(prev => [...prev, {
        id: assistantMsgId,
        content: '',
        role: 'assistant',
        createdAt: new Date().toISOString()
      }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'chunk') {
                assistantMessage += data.content
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMsgId 
                    ? { ...msg, content: assistantMessage }
                    : msg
                ))
              } else if (data.type === 'error') {
                setError(data.error)
                if (data.retryAfter) {
                  setRateLimitInfo(prev => ({ 
                    ...prev!, 
                    retryAfter: data.retryAfter 
                  }))
                }
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', line)
            }
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error)
      setError('Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Rate Limit Info */}
      {rateLimitInfo && (
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Requests remaining: {rateLimitInfo.remaining}
            </span>
            <span className="text-muted-foreground">
              Resets: {new Date(rateLimitInfo.resetTime).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="mb-4" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card className={`max-w-[80%] ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              <CardContent className="p-3">
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading || (rateLimitInfo?.retryAfter && rateLimitInfo.retryAfter > 0)}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={isLoading || !input.trim() || (rateLimitInfo?.retryAfter && rateLimitInfo.retryAfter > 0)}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}