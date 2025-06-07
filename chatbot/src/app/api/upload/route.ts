import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processDocument, processDocumentAlternative, generateEmbedding, validateFile } from '@/lib/document-processing'
import { storeEmbeddings } from '@/lib/vector-store'

export async function POST(request: NextRequest) {
  console.log('📥 [UPLOAD] Incoming upload request...')

  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const conversationId = formData.get('conversationId') as string

    console.log('🧾 [UPLOAD] Received form data')
    console.log(`📂 [UPLOAD] Number of files: ${files.length}`)
    console.log(`💬 [UPLOAD] Conversation ID: ${conversationId}`)

    if (!files.length) {
      console.warn('⚠️ [UPLOAD] No files provided')
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    if (!conversationId) {
      console.warn('⚠️ [UPLOAD] Missing conversation ID')
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    const uploadedFiles = []

    for (const file of files) {
      console.log(`📄 [FILE] Processing file: ${file.name} (${file.size} bytes, ${file.type})`)

      try {
        // Step 1: Validate file
        const validation = validateFile(file)
        if (!validation.isValid) {
          console.warn(`⚠️ [VALIDATION] File validation failed: ${validation.error}`)
          uploadedFiles.push({
            filename: file.name,
            status: 'error',
            error: validation.error
          })
          continue
        }

        // Step 2: Process the document with fallback
        console.log(`🔄 [PROCESS] Starting document processing...`)
        let docs
        
        try {
          docs = await processDocument(file)
        } catch (primaryError) {
          console.warn(`⚠️ [PROCESS] Primary processing failed, trying alternative...`)
          console.error(primaryError)
          
          if (file.type === 'application/pdf') {
            docs = await processDocumentAlternative(file)
          } else {
            throw primaryError
          }
        }
        
        console.log(`✅ [DOCS] Document parsed into ${docs.length} chunks`)

        if (docs.length === 0) {
          throw new Error('No content could be extracted from the document')
        }

        // Step 3: Create document record
        const document = await prisma.document.create({
          data: {
            filename: `${Date.now()}-${file.name}`,
            originalName: file.name,
            fileType: file.type,
            fileSize: file.size,
            conversationId,
            processed: false,
          }
        })
        console.log(`📝 [DB] Document record created: ${document.id}`)

        // Step 4: Process chunks and generate embeddings
        const chunks = []
        for (const [index, doc] of docs.entries()) {
          try {
            console.log(`🧠 [EMBED] Processing chunk ${index + 1}/${docs.length}`)
            const embedding = await generateEmbedding(doc.pageContent)
            
            const chunk = await prisma.documentChunk.create({
              data: {
                content: doc.pageContent,
                metadata: doc.metadata as any,
                embeddings: embedding,
                documentId: document.id,
              }
            })
            console.log(`📦 [DB] Chunk stored: ${chunk.id}`)

            chunks.push({
              id: chunk.id,
              content: doc.pageContent,
              metadata: doc.metadata,
              embedding,
            })
          } catch (chunkError) {
            console.error(`❌ [ERROR] Failed to process chunk ${index + 1}:`, chunkError)
          }
        }

        if (chunks.length === 0) {
          throw new Error('Failed to process any chunks from the document')
        }

        // Step 5: Store embeddings in vector DB (optional)
        try {
          await storeEmbeddings(chunks)
          console.log(`🧾 [VECTOR] Stored ${chunks.length} embeddings in vector DB`)
        } catch (vectorError) {
          console.error(`⚠️ [VECTOR] Failed to store in vector DB, but continuing:`, vectorError)
        }

        // Step 6: Mark as processed
        await prisma.document.update({
          where: { id: document.id },
          data: { processed: true }
        })
        console.log(`✅ [DB] Document marked as processed: ${document.id}`)

        uploadedFiles.push({
          id: document.id,
          filename: file.name,
          status: 'success',
          chunksProcessed: chunks.length
        })

      } catch (error) {
        console.error(`❌ [ERROR] Error processing file "${file.name}":`, error)
        uploadedFiles.push({
          filename: file.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = uploadedFiles.filter(f => f.status === 'success').length
    const errorCount = uploadedFiles.filter(f => f.status === 'error').length

    console.log(`🎉 [UPLOAD] Upload process complete: ${successCount} success, ${errorCount} errors`)
    
    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      summary: {
        total: files.length,
        successful: successCount,
        failed: errorCount
      }
    })

  } catch (error) {
    console.error('❌ [FATAL] Upload error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}