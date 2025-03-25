import OpenAI from 'openai';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.INKEEP_API_KEY) {
  throw new Error('INKEEP_API_KEY is required');
}

const client = new OpenAI({
  baseURL: 'https://api.inkeep.com/v1/',
  apiKey: process.env.INKEEP_API_KEY,
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


// Wrap your code in an async function
async function main() {
  const completion = await client.beta.chat.completions.parse({
    model: "inkeep-rag",
    messages: [
      { role: "user", content: "How do I get started?" },
    ],
  });

  const event = completion.choices[0].message.content;
  const parsedContent = JSON.parse(event);

  console.log("Parsed RAG Response:");
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
      console.log(`Record Type: ${doc.record_type || 'N/A'}`);
      console.log('---');
    });
  } else {
    console.error("Schema validation failed:", validationResult.error);
  }
}

// Invoke our async function
main().catch((err) => {
  console.error(err);
});