import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable')
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)

export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
  },
})

export const embedModel = genAI.getGenerativeModel({ 
  model: 'text-embedding-004' 
})