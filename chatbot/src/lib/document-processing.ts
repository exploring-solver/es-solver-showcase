import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { Document } from '@langchain/core/documents'
import mammoth from 'mammoth'
// DO NOT import pdf-parse at the top level - use dynamic import instead
import { embedModel } from './gemini'

export async function processDocument(file: File): Promise<Document[]> {
  let content = ''
  
  try {
    console.log(`🔄 [PROCESS] Starting to process file: ${file.name} (${file.type})`)
    
    if (file.type === 'application/pdf') {
      console.log('📄 [PDF] Processing PDF file...')
      
      // Dynamic import to avoid module-level issues
      const pdfParse = (await import('pdf-parse')).default
      
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      console.log(`📄 [PDF] Buffer created, size: ${buffer.length} bytes`)
      
      const pdf = await pdfParse(buffer, {
        // Add options to make parsing more robust
        max: 0, // Parse all pages
        version: 'v2.0.550', // Specify version
      })
      
      content = pdf.text
      console.log(`✅ [PDF] Extracted ${content.length} characters from PDF`)
      console.log(`📊 [PDF] Pages: ${pdf.numpages}, Info: ${JSON.stringify(pdf.info)}`)
      
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('📝 [DOCX] Processing DOCX file...')
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      content = result.value
      console.log(`✅ [DOCX] Extracted ${content.length} characters from DOCX`)
      
    } else if (file.type === 'text/plain' || file.type === 'text/csv') {
      console.log('📄 [TEXT] Processing text file...')
      content = await file.text()
      console.log(`✅ [TEXT] Extracted ${content.length} characters from text file`)
      
    } else {
      throw new Error(`Unsupported file type: ${file.type}`)
    }

    if (!content || content.trim().length === 0) {
      throw new Error('No content could be extracted from the file')
    }

    console.log('🔪 [SPLIT] Creating text splitter...')
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', ' ', ''],
    })

    const docs = await splitter.createDocuments([content], [{
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      processedAt: new Date().toISOString(),
    }])

    console.log(`✅ [SPLIT] Created ${docs.length} document chunks`)
    return docs

  } catch (error) {
    console.error(`❌ [ERROR] Error processing document "${file.name}":`, error)
    throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    console.log(`🧠 [EMBED] Generating embedding for text of length: ${text.length}`)
    
    if (!text || text.trim().length === 0) {
      throw new Error('Cannot generate embedding for empty text')
    }

    // Truncate text if it's too long (Gemini has token limits)
    const maxLength = 8000 // Conservative limit
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text
    
    if (text.length > maxLength) {
      console.warn(`⚠️ [EMBED] Text truncated from ${text.length} to ${maxLength} characters`)
    }

    const result = await embedModel.embedContent(truncatedText)
    const embedding = result.embedding.values
    
    console.log(`✅ [EMBED] Generated embedding with ${embedding.length} dimensions`)
    return embedding
    
  } catch (error) {
    console.error('❌ [ERROR] Error generating embedding:', error)
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper function to validate file before processing
export function validateFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (10MB)`
    }
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type "${file.type}" is not supported. Allowed types: PDF, DOCX, TXT, CSV`
    }
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File is empty'
    }
  }

  return { isValid: true }
}

// Alternative PDF processing using a different library (backup option)
export async function processDocumentAlternative(file: File): Promise<Document[]> {
  let content = ''
  
  try {
    console.log(`🔄 [PROCESS-ALT] Starting to process file: ${file.name} (${file.type})`)
    
    if (file.type === 'application/pdf') {
      console.log('📄 [PDF-ALT] Using alternative PDF processing...')
      
      try {
        // Try using pdf2pic or another library as backup
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        
        // Convert to text using a simple extraction method
        const decoder = new TextDecoder('utf-8')
        const rawText = decoder.decode(uint8Array)
        
        // Extract text content between stream objects (basic PDF parsing)
        const textMatches = rawText.match(/stream\s*(.*?)\s*endstream/gs)
        if (textMatches) {
          content = textMatches
            .map(match => match.replace(/stream|endstream/g, '').trim())
            .join(' ')
            .replace(/[^\x20-\x7E\n\r]/g, ' ') // Remove non-printable characters
            .replace(/\s+/g, ' ')
            .trim()
        }
        
        if (!content) {
          throw new Error('Could not extract text from PDF using alternative method')
        }
        
        console.log(`✅ [PDF-ALT] Extracted ${content.length} characters using alternative method`)
        
      } catch (altError) {
        console.error('❌ [PDF-ALT] Alternative PDF processing failed:', altError)
        throw new Error('PDF processing failed with both primary and alternative methods')
      }
      
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('📝 [DOCX] Processing DOCX file...')
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      content = result.value
      console.log(`✅ [DOCX] Extracted ${content.length} characters from DOCX`)
      
    } else if (file.type === 'text/plain' || file.type === 'text/csv') {
      console.log('📄 [TEXT] Processing text file...')
      content = await file.text()
      console.log(`✅ [TEXT] Extracted ${content.length} characters from text file`)
      
    } else {
      throw new Error(`Unsupported file type: ${file.type}`)
    }

    if (!content || content.trim().length === 0) {
      throw new Error('No content could be extracted from the file')
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', ' ', ''],
    })

    const docs = await splitter.createDocuments([content], [{
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      processedAt: new Date().toISOString(),
    }])

    console.log(`✅ [SPLIT-ALT] Created ${docs.length} document chunks`)
    return docs

  } catch (error) {
    console.error(`❌ [ERROR-ALT] Error processing document "${file.name}":`, error)
    throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}