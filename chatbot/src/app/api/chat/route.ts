import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { geminiModel } from '@/lib/gemini'
import { generateEmbedding } from '@/lib/document-processing'
import { searchSimilarChunks } from '@/lib/vector-store'

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId } = await request.json()

    if (!message || !conversationId) {
      return NextResponse.json(
        { error: 'Message and conversation ID are required' },
        { status: 400 }
      )
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        content: message,
        role: 'user',
        conversationId,
      }
    })

    // Generate embedding for the user's question
    const queryEmbedding = await generateEmbedding(message)

    // Search for relevant document chunks
    const similarChunks = await searchSimilarChunks(queryEmbedding, 5)

    // Prepare context from retrieved chunks
    const context = similarChunks
      .map(chunk => chunk.metadata?.content || '')
      .filter(content => content.length > 0)
      .join('\n\n')

    // Create prompt with context
    const prompt = `You are a helpful AI assistant with access to relevant documents. Use the provided context to answer the user's question accurately and cite your sources when appropriate.

Context from documents:
${context}

User question: ${message}

Please provide a comprehensive answer based on the context provided. If the context doesn't contain enough information to fully answer the question, acknowledge this and provide what information you can.`

    // Generate response using Gemini
    const result = await geminiModel.generateContent(prompt)
    const assistantResponse = result.response.text()

    // Save assistant message with citations
    const assistantMessage = await prisma.message.create({
      data: {
        content: assistantResponse,
        role: 'assistant',
        conversationId,
      }
    })

    // Create citations for relevant chunks
    if (similarChunks.length > 0) {
      const citations = await Promise.all(
        similarChunks.slice(0, 3).map(async (chunk) => {
          // Find the document this chunk belongs to
          const documentChunk = await prisma.documentChunk.findFirst({
            where: { content: chunk.metadata?.content },
            include: { document: true }
          })

          if (documentChunk) {
            return prisma.citation.create({
              data: {
                content: chunk.metadata?.content || '',
                pageNumber: chunk.metadata?.pageNumber || null,
                messageId: assistantMessage.id,
                documentId: documentChunk.document.id,
              }
            })
          }
          return null
        })
      )
    }

    // Fetch the complete message with citations
    const messageWithCitations = await prisma.message.findUnique({
      where: { id: assistantMessage.id },
      include: {
        citations: {
          include: {
            document: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: {
        id: messageWithCitations!.id,
        content: messageWithCitations!.content,
        role: messageWithCitations!.role,
        createdAt: messageWithCitations!.createdAt,
        citations: messageWithCitations!.citations.map(citation => ({
          id: citation.id,
          content: citation.content,
          filename: citation.document.originalName,
          pageNumber: citation.pageNumber,
        }))
      }
    })

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}