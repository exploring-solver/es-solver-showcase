import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { DocumentInterface } from "@langchain/core/documents";

import { prisma } from "./prisma";
import { getVectorStore } from "./vector-store";

const googleApiKey = process.env.GOOGLE_API_KEY;

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(googleApiKey as string);

export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: googleApiKey,
  model: "text-embedding-004", // Gemini embedding model
  
});

export const chatModel = new ChatGoogleGenerativeAI({
  apiKey: googleApiKey,
  model: "gemini-pro", // Gemini chat model
  temperature: 0.3,
  streaming: true,
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
  callbacks: [{
    handleLLMStart: async () => {
      console.log('Starting Gemini LLM...');
    },
    handleLLMError: async (err) => {
      console.error('Gemini LLM Error:', err);
    },
    handleLLMEnd: async () => {
      console.log('Gemini LLM End');
    },
  }],
});

// Create a client for direct Gemini API access if needed
export const client = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function generateEmbedding(text: string) {
  return embeddings.embedQuery(text);
}

const SYSTEM_TEMPLATE = `You are a helpful AI assistant that answers questions based on the provided context from user documents.
You will be given:
1. CONTEXT: Relevant information from user-uploaded documents
2. QUESTION: A question from the user

Your goal is to provide accurate answers based SOLELY on the provided CONTEXT. If the CONTEXT doesn't contain enough information to answer the question fully, acknowledge the limitations and avoid making up information.

When quoting or referencing information, mention that it comes from their documents.
Format your responses using Markdown for clarity when appropriate.
Be concise but thorough in your answers.`;

export async function getRelevantDocuments(
  conversationId: string,
  query: string
) {
  try {
    // Get the vector store for this conversation
    const vectorStore = await getVectorStore();
    
    // Get conversation documents to limit search
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { documents: true },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Get document IDs to filter search
    const documentIds = conversation.documents.map((doc: any) => doc.id);
    
    if (documentIds.length === 0) {
      return [];
    }

    // Search for relevant chunks
    const results = await vectorStore.similaritySearch(
      query,
      5, // Top k results
      { documentIds } // Filter by these documents
    );

    return results;
  } catch (error) {
    console.error("Error retrieving relevant documents:", error);
    return [];
  }
}

export async function createRagChain() {
  const ragChain = RunnableSequence.from([
    {
      context: (input: { documents: DocumentInterface[]; question: string }) => 
        formatDocumentsAsString(input.documents),
      question: (input: { documents: DocumentInterface[]; question: string }) => 
        input.question,
    },
    {
      system: (_: any) => new SystemMessage(SYSTEM_TEMPLATE),
      messages: (input: { context: string; question: string }) => [
        new HumanMessage(`CONTEXT:
${input.context}

QUESTION:
${input.question}`),
      ],
    },
    chatModel,
    new StringOutputParser(),
  ]);
  
  return ragChain;
}

// Function to stream text from Gemini (alternative to the AI SDK streamText)
export async function streamGeminiText(
  prompt: string, 
  systemPrompt: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const generationConfig = {
    temperature: 0.3,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  };

  const chat = model.startChat({
    generationConfig,
    history: [],
    systemInstruction: systemPrompt,
  });

  const result = await chat.sendMessageStream(prompt);
  
  // Return the stream parts
  return result;
}