import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { InkeepRAGResponseSchema } from "@/lib/chat/inkeep-rag-schema";

export const runtime = "edge";

const openai = createOpenAI({
  apiKey: process.env.INKEEP_API_KEY,
  baseURL: "https://api.inkeep.com/v1"
});

export async function POST(req: Request) {
  const reqJson = await req.json();

  const result = await streamText({
    model: openai("inkeep-rag-20250310"),
    messages: reqJson.messages.map((message: any) => ({
      role: message.role,
      content: message.content,
      id: message.id
    })),
    response_format: {
      schema: InkeepRAGResponseSchema
    }
  });

  return result.toDataStreamResponse();
}
