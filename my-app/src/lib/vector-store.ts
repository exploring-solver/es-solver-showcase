import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { Document } from "@langchain/core/documents";
import { embeddings } from "./gemini";

const pineconeApiKey = process.env.PINECONE_API_KEY!;
const pineconeIndexName = process.env.PINECONE_INDEX!;

let vectorStoreInstance: PineconeStore | null = null;

export async function initVectorStore() {
  try {
    // Configure Pinecone with the HTTP client for Edge compatibility
    const pinecone = new Pinecone({
      apiKey: pineconeApiKey,
      // Edge requires the HTTP client
      
    });

    const index = pinecone.Index(pineconeIndexName);

    vectorStoreInstance = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
    });

    return vectorStoreInstance;
  } catch (error) {
    console.error("Failed to initialize vector store:", error);
    throw error;
  }
}

// Rest of your code remains the same
export async function getVectorStore() {
  if (!vectorStoreInstance) {
    return await initVectorStore();
  }
  return vectorStoreInstance;
}

export async function addDocumentsToVectorStore(
  documents: Document[],
  documentId: string
) {
  try {
    const vectorStore = await getVectorStore();
    
    // Add metadata with documentId to each document
    const docsWithMetadata = documents.map((doc) => {
      return new Document({
        pageContent: doc.pageContent,
        metadata: {
          ...doc.metadata,
          documentId,
        },
      });
    });
    
    await vectorStore.addDocuments(docsWithMetadata);
    
    return true;
  } catch (error) {
    console.error("Error adding documents to vector store:", error);
    return false;
  }
}