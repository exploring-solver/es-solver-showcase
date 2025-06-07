import { Pinecone } from '@pinecone-database/pinecone'

interface DocumentChunk {
  id: string
  content: string
  metadata: any
  embedding: number[]
}

interface SearchResult {
  id: string
  content: string
  metadata: any
  score: number
}

let pineconeClient: Pinecone | null = null
let pineconeIndex: any = null

export async function initializePinecone() {
  console.log('🔌 [PINECONE] Initializing Pinecone client...')
  
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY environment variable is required')
  }

  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    })
    console.log('✅ [PINECONE] Client initialized')
  }

  if (!pineconeIndex) {
    const indexName = process.env.PINECONE_INDEX_NAME || 'chatbot-documents'
    pineconeIndex = pineconeClient.index(indexName)
    console.log(`✅ [PINECONE] Connected to index: ${indexName}`)
  }

  return pineconeIndex
}

export async function storeEmbeddings(chunks: DocumentChunk[]): Promise<void> {
  try {
    console.log(`📦 [VECTOR] Storing ${chunks.length} embeddings in Pinecone...`)
    
    const index = await initializePinecone()

    // Format vectors for Pinecone
    const vectors = chunks.map(chunk => ({
      id: chunk.id,
      values: chunk.embedding,
      metadata: Object.fromEntries(
        Object.entries({
          content: chunk.content,
          ...chunk.metadata,
          filename: String(chunk.metadata?.filename || 'unknown'),
          chunkIndex: Number(chunk.metadata?.chunkIndex || 0),
          documentId: String(chunk.metadata?.documentId || ''),
          conversationId: String(chunk.metadata?.conversationId || ''), // <-- ADD THIS LINE
        }).map(([key, value]) => [
          key,
          (typeof value === 'object' && value !== null && !Array.isArray(value))
            ? JSON.stringify(value)
            : value
        ])
      )
    }))

    // Upsert vectors in batches to avoid rate limits
    const batchSize = 100
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize)
      console.log(`🔄 [VECTOR] Upserting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(vectors.length/batchSize)}`)
      
      await index.upsert(batch)
    }

    console.log(`✅ [VECTOR] Successfully stored ${chunks.length} embeddings`)
  } catch (error) {
    console.error('❌ [VECTOR] Error storing embeddings:', error)
    throw new Error(`Failed to store embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function searchSimilarChunks(
  queryEmbedding: number[], 
  conversationId?: string, 
  topK: number = 5
): Promise<SearchResult[]> {
  try {
    console.log(`🔍 [SEARCH] Searching for similar chunks (topK: ${topK}, conversationId: ${conversationId})`)
    
    const index = await initializePinecone()

    // Build the query object correctly
    const queryRequest: any = {
      vector: queryEmbedding,
      topK: topK, // Ensure this is a number, not a string
      includeMetadata: true,
      includeValues: false,
    }

    // Add filter if conversationId is provided
    if (conversationId) {
      queryRequest.filter = {
        conversationId: { $eq: conversationId }
      }
      console.log(`🔍 [SEARCH] Filtering by conversationId: ${conversationId}`)
    }

    console.log(`🔍 [SEARCH] Query request:`, {
      vectorLength: queryEmbedding.length,
      topK: queryRequest.topK,
      hasFilter: !!queryRequest.filter
    })

    const searchResponse = await index.query(queryRequest)
    
    console.log(`✅ [SEARCH] Found ${searchResponse.matches?.length || 0} matches`)

    if (!searchResponse.matches) {
      return []
    }

    // Transform results
    const results: SearchResult[] = searchResponse.matches.map((match: any) => ({
      id: match.id,
      content: match.metadata?.content || '',
      metadata: match.metadata || {},
      score: match.score || 0,
    }))

    console.log(`📊 [SEARCH] Top scores: ${results.slice(0, 3).map(r => r.score.toFixed(3)).join(', ')}`)
    
    return results

  } catch (error) {
    console.error('❌ [SEARCH] Error searching similar chunks:', error)
    // Don't throw error, return empty array to allow chat to continue
    return []
  }
}

export async function deleteChunksByDocumentId(documentId: string): Promise<void> {
  try {
    console.log(`🗑️ [VECTOR] Deleting chunks for document: ${documentId}`)
    
    const index = await initializePinecone()
    
    // Delete by filter
    await index.deleteMany({
      filter: {
        documentId: { $eq: documentId }
      }
    })
    
    console.log(`✅ [VECTOR] Deleted chunks for document: ${documentId}`)
  } catch (error) {
    console.error('❌ [VECTOR] Error deleting chunks:', error)
    throw new Error(`Failed to delete chunks: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
