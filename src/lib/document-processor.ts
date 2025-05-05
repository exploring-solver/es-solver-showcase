import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import { addDocumentsToVectorStore, getVectorStore } from "./vector-store";
import { use } from "react";
import { prisma } from "./prisma";
import { generateEmbedding } from "./gemini";

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export async function processAndStoreDocument(
  file: Buffer,
  filename: string,
  userId: string,
  conversationId: string,
  fileType: string
) {
  try {
    let documents: Document[] = [];
    
    // Create a temporary file path
    const tempFilePath = join(tmpdir(), filename);
    
    // Write the buffer to a temporary file
    writeFileSync(tempFilePath, file);
    
    try {
      // Use the appropriate loader with the file path
      if (fileType === "application/pdf") {
        const loader = new PDFLoader(tempFilePath);
        documents = await loader.load();
      } else if (fileType === "text/csv") {
        const loader = new CSVLoader(tempFilePath);
        documents = await loader.load();
      } else if (fileType === "text/plain") {
        const loader = new TextLoader(tempFilePath);
        documents = await loader.load();
      } else if (
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const loader = new DocxLoader(tempFilePath);
        documents = await loader.load();
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
    } finally {
      // Clean up: delete the temporary file
      try {
        unlinkSync(tempFilePath);
      } catch (e) {
        console.error("Error cleaning up temp file:", e);
      }
    }

    if (documents.length === 0) {
      throw new Error("No content could be extracted from the document");
    }

    // Split documents into chunks
    const chunks = await textSplitter.splitDocuments(documents);
    
    // Store document in database
    const fullText = documents.map((doc) => doc.pageContent).join("\n");
    
    const document = await prisma.document.create({
      data: {
        name: filename,
        type: fileType,
        content: fullText,
        userId,
        conversations: {
          connect: { id: conversationId },
        },
      },
    });

    // Store chunks in database
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.pageContent);
      
      await prisma.chunk.create({
        data: {
          content: chunk.pageContent,
          metadata: chunk.metadata,
          embedding: embedding,
          documentId: document.id,
        },
      });
    }

    // Add documents to vector store
    await addDocumentsToVectorStore(chunks, document.id);

    return document;
  } catch (error) {
    console.error("Error processing document:", error);
    throw error;
  }
}