import { client } from "./client";
import { InkeepRAGResponseSchema } from "./rag-schema";
import { zodToJsonSchema } from "zod-to-json-schema";

async function getRAGResponse() {
  try {
    const response = await client.beta.chat.completions.parse({
      model: "inkeep-rag-20250310",
      messages: [
        { role: "user", content: "How do I get started with Inkeep?" }
      ],
      response_format: {
        type: "json_object",
        schema: zodToJsonSchema(InkeepRAGResponseSchema)
      },
    });

    const ragResponse = response.choices[0].message.parsed;
    
    console.log("RAG Response:");
    console.log(JSON.stringify(ragResponse, null, 2));
    
    return ragResponse;
  } catch (error) {
    console.error("Error in getRAGResponse:", error);
  }
}

// Run the main function
getRAGResponse().catch((error) =>
  console.error("Error in getRAGResponse:", error),
);
