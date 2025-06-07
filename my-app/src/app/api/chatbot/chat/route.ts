import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../../lib/auth";
import { prisma } from "@/lib/prisma";
import { getRelevantDocuments, streamGeminiText } from "@/lib/gemini";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("POST /api/chatbot/chat - session:", session);

    if (!session) {
      console.log("POST /api/chatbot/chat - Unauthorized");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { message, conversationId } = await req.json();
    console.log("POST /api/chatbot/chat - message:", message, "conversationId:", conversationId);

    if (!message || !conversationId) {
      console.log("POST /api/chatbot/chat - Missing message or conversationId");
      return new Response(
        JSON.stringify({ error: "Message and conversation ID are required" }),
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        userId: session.user?.id,
      },
    });

    if (!conversation) {
      console.log("POST /api/chatbot/chat - Conversation not found");
      return new Response(
        JSON.stringify({ error: "Conversation not found" }),
        { status: 404 }
      );
    }

    const userMessage = await prisma.message.create({
      data: {
        content: message,
        role: "USER",
        conversationId,
      },
    });

    console.log("POST /api/chatbot/chat - user message saved:", userMessage.id);

    const relevantDocs = await getRelevantDocuments(conversationId, message);
    const context = relevantDocs.map(doc => doc.pageContent).join('\n\n');

    const assistantMessage = await prisma.message.create({
      data: {
        content: "",
        role: "ASSISTANT",
        conversationId,
      },
    });

    console.log("POST /api/chatbot/chat - assistant message created:", assistantMessage.id);

    let accumulatedContent = "";

    const systemPrompt = `Use the following context to answer the question. If the context is insufficient, say so. Context:\n${context}`;
    const geminiStream = await streamGeminiText(message, systemPrompt);

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = typeof chunk === "string" ? chunk : chunk.text ?? "";
        accumulatedContent += text;

        try {
          await prisma.message.update({
            where: { id: assistantMessage.id },
            data: { content: accumulatedContent }
          });
        } catch (error) {
          console.error("Error updating message in database:", error);
        }

        controller.enqueue(new TextEncoder().encode(text));
      },
      async flush(controller) {
        try {
          if (relevantDocs.length > 0) {
            const chunkIds = [];

            for (const doc of relevantDocs) {
              if (doc.metadata && doc.metadata.documentId) {
                const chunk = await prisma.chunk.findFirst({
                  where: {
                    documentId: doc.metadata.documentId,
                    content: doc.pageContent,
                  },
                });

                if (chunk) {
                  chunkIds.push(chunk.id);
                }
              }
            }

            for (const chunkId of chunkIds) {
              await prisma.citation.create({
                data: {
                  messageId: assistantMessage.id,
                  chunkId,
                },
              });
            }
            console.log("POST /api/chatbot/chat - citations created:", chunkIds);
          }
        } catch (error) {
          console.error("Error creating citations:", error);
        }
      }
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of geminiStream) {
          controller.enqueue(chunk);
        }
        controller.close();
      }
    });

    const responseStream = readableStream.pipeThrough(transformStream);

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process message", details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}