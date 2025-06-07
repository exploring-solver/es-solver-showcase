import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../../lib/auth"
import { prisma } from "@/lib/prisma";

import { ConversationList } from "@/components/chatbot/conversation-list";
import { ChatUI } from "@/components/chatbot/chat-ui";

export const metadata: Metadata = {
  title: "AI Conversation",
  description: "Chat with AI about your documents",
}

interface ConversationPageProps {
  params: {
    conversationId: string
  }
}

export default async function ConversationPage({
  params,
} :ConversationPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    console.log("ConversationPage: No session, redirecting to /sign-in");
    redirect("/sign-in");
  }

  const { conversationId } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: conversationId,
      userId: session.user?.id,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!conversation) {
    console.log("ConversationPage: Conversation not found, redirecting to /module/ai-chatbot");
    redirect("/module/ai-chatbot");
  }

  console.log("ConversationPage: Loaded conversation", conversationId);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {conversation.title || "AI Conversation"}
        </h1>
        <p className="text-muted-foreground">
          Chat with AI about your documents
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        {/* Conversation list sidebar */}
        <div className="md:border-r md:pr-6">
          <ConversationList />
        </div>

        {/* Chat UI */}
        <div>
          <ChatUI
            conversationId={conversationId}
            initialMessages={conversation.messages}
          />
        </div>
      </div>
    </div>
  );
}