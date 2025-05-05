import { Metadata } from "next"
import { redirect } from "next/navigation"
import getServerSession from "next-auth"

import { authOptions } from "../../../lib/auth"
import { prisma } from "@/lib/prisma";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ConversationList } from "@/components/chatbot/conversation-list"
import { FileText, MessageSquare, Upload } from "lucide-react"

export const metadata: Metadata = {
  title: "AI Chatbot with RAG",
  description: "Chat with your documents using AI",
}

export default async function AIChatbotPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  // Get user's document count and conversation count
  const documentCount = await prisma.document.count({
    where: {
      userId: session.user?.id,
    },
  })

  const conversationCount = await prisma.conversation.count({
    where: {
      userId: session.user?.id,
    },
  })

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Chatbot with RAG</h1>
        <p className="text-muted-foreground">
          Chat with your documents using AI. Upload PDF, TXT, CSV, or DOCX files.
        </p>
      </div>
      
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversationCount}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        {/* Conversation list sidebar */}
        <div className="md:border-r md:pr-6">
          <ConversationList />
        </div>
        
        {/* Main welcome content */}
        <div className="flex flex-col items-center justify-center gap-8 p-8">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <MessageSquare className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Start a New Conversation</h2>
            <p className="text-muted-foreground">
              Select an existing conversation or create a new one to begin
            </p>
          </div>
          
          <div className="flex flex-col gap-6 max-w-md text-center">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">How It Works</h3>
              <ul className="space-y-4 text-left">
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-muted p-1">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-medium">Upload Documents</span>
                    <p className="text-sm text-muted-foreground">
                      Upload PDFs, TXT, CSV, or DOCX files to be processed
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-muted p-1">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-medium">Ask Questions</span>
                    <p className="text-sm text-muted-foreground">
                      Chat with AI about the content of your documents
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-muted p-1">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-medium">Get Answers with Citations</span>
                    <p className="text-sm text-muted-foreground">
                      Receive answers based on your documents with references
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}