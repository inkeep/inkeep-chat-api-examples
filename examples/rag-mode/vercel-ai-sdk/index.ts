import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

if (!process.env.INKEEP_API_KEY) {
  throw new Error('INKEEP_API_KEY is required');
}

// Initialize OpenAI client with Inkeep's base URL
const openai = createOpenAI({
  apiKey: process.env.INKEEP_API_KEY,
  baseURL: 'https://api.inkeep.com/v1'
});

// Define the RAG document schema
const InkeepSourceContentSchema = z.object({
  type: z.union([z.literal('text'), z.string()]),
  media_type: z.union([z.literal('text/plain'), z.string()]).optional(),
  text: z.string().optional(),
  data: z.string().optional(),
}).passthrough();

const InkeepSourceSchema = z.object({
  content: z.array(InkeepSourceContentSchema).optional(),
  type: z.union([z.literal('content'), z.string()]).optional(),
  media_type: z.string().optional(),
  data: z.string().optional(),
}).passthrough();

const InkeepRAGDocumentSchema = z.object({
  type: z.string(),
  source: InkeepSourceSchema,
  title: z.string().optional(),
  context: z.string().optional(),
  record_type: z.string().optional(),
  url: z.string().optional(),
}).passthrough();

const InkeepRAGResponseSchema = z.object({
  content: z.array(InkeepRAGDocumentSchema),
}).passthrough();

async function getRAGResponse() {
  try {
    console.log("Fetching RAG response...");
    
    // Create a fetch request to inspect the raw HTTP response
    const rawResponse = await fetch('https://api.inkeep.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INKEEP_API_KEY}`
      },
      body: JSON.stringify({
        model: 'inkeep-rag',
        messages: [
          { role: 'user', content: 'How do I get started?' }
        ],
        response_format: { type: 'json_object' }
      })
    });
    
    console.log("Raw HTTP Response Status:", rawResponse.status);
    const rawData = await rawResponse.json();
    console.log("Raw HTTP Response:", JSON.stringify(rawData, null, 2));
    
    // Parse the raw response
    if (rawData.choices && rawData.choices[0] && rawData.choices[0].message.content) {
      try {
        const parsedContent = JSON.parse(rawData.choices[0].message.content);
        console.log("Parsed Content:");
        console.log(JSON.stringify(parsedContent, null, 2));
        
        // Validate against our schema
        const validationResult = InkeepRAGResponseSchema.safeParse(parsedContent);
        if (validationResult.success) {
          console.log("Schema validation successful!");
          
          // Process the RAG documents
          validationResult.data.content.forEach((doc, index) => {
            console.log(`Document ${index + 1}:`);
            console.log(`Title: ${doc.title || 'N/A'}`);
            console.log(`URL: ${doc.url || 'N/A'}`);
            console.log(`Context: ${doc.context || 'N/A'}`);
            console.log(`Source Type: ${doc.source_type || 'N/A'}`);
            console.log('---');
          });
          
          return validationResult.data;
        } else {
          console.error("Schema validation failed:", validationResult.error);
        }
      } catch (error) {
        console.error("Error parsing JSON content:", error);
      }
    } else {
      console.error("No content in response");
    }
    
    return null;
  } catch (error) {
    console.error("Error in getRAGResponse:", error);
  }
}

getRAGResponse();
