"use client"

import React from 'react'
import { User, Bot, FileText, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface Citation {
  id: string
  content: string
  filename: string
  pageNumber?: number
}

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: string
  citations?: Citation[]
}

interface MessageDisplayProps {
  messages: Message[]
  isTyping?: boolean
}

export function MessageDisplay({ messages, isTyping }: MessageDisplayProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {message.role === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            
            <div className="flex-1">
              <Card className={message.role === 'user' ? 'bg-primary text-primary-foreground' : ''}>
                <CardContent className="p-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                  
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        Sources
                      </h4>
                      <div className="space-y-2">
                        {message.citations.map((citation) => (
                          <div
                            key={citation.id}
                            className="p-2 bg-muted/50 rounded text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{citation.filename}</span>
                              {citation.pageNumber && (
                                <span className="text-muted-foreground">
                                  Page {citation.pageNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground line-clamp-2">
                              {citation.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className={`text-xs text-muted-foreground mt-1 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                {new Date(message.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
              <Bot className="h-4 w-4" />
            </div>
            
            <Card>
              <CardContent className="p-4">
                <div className="typing-indicator">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  )
}
