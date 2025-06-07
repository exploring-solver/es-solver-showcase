import { GoogleGenerativeAI } from '@google/generative-ai'
import { rateLimiter } from './rate-limiter'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

// Use different models based on task
export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash', // Switch to Flash model (higher rate limits)
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.8,
    maxOutputTokens: 2048,
  }
})

export const embedModel = genAI.getGenerativeModel({ 
  model: 'text-embedding-004' // Use dedicated embedding model
})

// Retry logic with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check rate limit before attempting
      const rateCheck = await rateLimiter.checkLimit('gemini-api')
      
      if (!rateCheck.allowed) {
        console.warn(`⏱️ [RATE-LIMIT] Hit rate limit, waiting ${rateCheck.retryAfter}s`)
        await new Promise(resolve => setTimeout(resolve, (rateCheck.retryAfter || 30) * 1000))
        continue
      }

      return await operation()
      
    } catch (error: any) {
      lastError = error
      console.error(`❌ [RETRY] Attempt ${attempt + 1} failed:`, error.message)

      // Handle specific error types
      if (error.status === 429) {
        // Rate limit error
        const retryAfter = error.errorDetails?.[0]?.retryDelay || '30s'
        const delayMs = parseRetryDelay(retryAfter)
        console.warn(`⏱️ [429] Rate limited, waiting ${delayMs}ms`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
        continue
      }

      if (error.status === 500 || error.status === 503) {
        // Server error - retry with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt)
        console.warn(`🔄 [${error.status}] Server error, retrying in ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // Non-retryable error
      throw error
    }
  }

  throw lastError
}

function parseRetryDelay(retryDelay: string): number {
  const match = retryDelay.match(/(\d+)([sm]?)/)
  if (!match) return 30000 // Default 30 seconds

  const value = parseInt(match[1])
  const unit = match[2] || 's'
  
  return unit === 'm' ? value * 60000 : value * 1000
}

// Enhanced streaming with rate limiting
export async function streamWithRetry(prompt: string, onChunk: (text: string) => void) {
  return withRetry(async () => {
    const result = await geminiModel.generateContentStream(prompt)
    let fullResponse = ''

    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      if (chunkText) {
        fullResponse += chunkText
        onChunk(chunkText)
      }
    }

    return fullResponse
  })
}