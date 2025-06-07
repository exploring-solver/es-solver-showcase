import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchSimilarChunks } from '@/lib/vector-store'
import { generateEmbedding } from '@/lib/document-processing'
import { streamWithRetry } from '@/lib/gemini-with-retry'
import { rateLimiter } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  console.log('💬 [STREAM] Incoming chat request...')

  try {
    const { message, conversationId } = await request.json()

    console.log(`📝 [STREAM] Message: "${message}"`)
    console.log(`💬 [STREAM] Conversation ID: ${conversationId}`)

    // Check rate limit before processing
    const rateStatus = rateLimiter.getStatus('chat-api')
    console.log(`📊 [RATE] Remaining requests: ${rateStatus.remaining}`)

    if (rateStatus.remaining === 0) {
      const waitTime = Math.ceil((rateStatus.resetTime - Date.now()) / 1000)
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          retryAfter: waitTime,
          message: `Too many requests. Please wait ${waitTime} seconds.`
        }),
        { 
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': waitTime.toString()
          }
        }
      )
    }

    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    })

    if (!conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get conversation context
    const recentMessages = conversation.messages.slice(-6) // Last 6 messages for context
    let contextualPrompt = message

    // Search for relevant document chunks if we have documents
    try {
      console.log('🔍 [SEARCH] Searching for relevant document chunks...')
      const queryEmbedding = await generateEmbedding(message)
      
      // FIXED: Correct parameter order (embedding, conversationId, topK)
      const relevantChunks = await searchSimilarChunks(queryEmbedding, conversationId, 3)
      
      if (relevantChunks.length > 0) {
        console.log(`✅ [SEARCH] Found ${relevantChunks.length} relevant chunks`)
        const context = relevantChunks
          .map(chunk => `Source: ${chunk.metadata?.filename || 'Unknown'}\n${chunk.content}`)
          .join('\n\n---\n\n')

        contextualPrompt = `Based on the following context from uploaded documents and conversation history, please answer the user's question.

DOCUMENT CONTEXT:
${context}

RECENT CONVERSATION:
${recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

USER QUESTION: ${message}

Please provide a helpful, accurate response based on the available context. If the context doesn't contain relevant information, say so and provide a general response.`
      } else {
        console.log('ℹ️ [SEARCH] No relevant document chunks found')
        contextualPrompt = `Based on the conversation history, please respond to the user's message.

RECENT CONVERSATION:
${recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

USER: ${message}

Please provide a helpful response.`
      }
    } catch (searchError) {
      console.error('⚠️ [SEARCH] Error searching documents:', searchError)
      // Continue without document context
    }

    // Save user message
    await prisma.message.create({
      data: {
        content: message,
        role: 'user',
        conversationId,
      }
    })

    // Create streaming response
    const encoder = new TextEncoder()
    let assistantResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamWithRetry(contextualPrompt, (chunkText) => {
            assistantResponse += chunkText
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              content: chunkText,
              type: 'chunk'
            })}\n\n`))
          })

          // Save assistant response
          await prisma.message.create({
            data: {
              content: assistantResponse,
              role: 'assistant',
              conversationId,
            }
          })

          // Send completion signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            messageId: 'generated'
          })}\n\n`))

          controller.close()

        } catch (error: any) {
          console.error('❌ [STREAM] Streaming error:', error)
          
          // Send error to client
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error.status === 429 
              ? 'Rate limit exceeded. Please wait a moment before sending another message.'
              : error.status === 400 && error.message.includes('API key')
              ? 'API key is invalid. Please check your environment configuration.'
              : 'An error occurred while generating the response.',
            retryAfter: error.status === 429 ? 30 : undefined
          })}\n\n`))
          
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Rate-Limit-Remaining': rateStatus.remaining.toString(),
        'X-Rate-Limit-Reset': new Date(rateStatus.resetTime).toISOString(),
      }
    })

  } catch (error) {
    console.error('❌ [STREAM] Fatal error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
