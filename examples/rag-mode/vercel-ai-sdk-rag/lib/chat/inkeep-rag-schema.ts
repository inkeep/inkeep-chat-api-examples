import { z } from "zod";

/* Inkeep RAG Document Schema */

export const InkeepRAGDocumentSchema = z.object({
  type: z.string(),
  source: z.record(z.any()),
  title: z.string().optional(),
  context: z.string().optional(),
  source_type: z.string().optional(),
  url: z.string().optional(),
});

export const InkeepRAGResponseSchema = z.object({
  content: z.array(InkeepRAGDocumentSchema),
});

export type InkeepRAGDocument = z.infer<typeof InkeepRAGDocumentSchema>;
export type InkeepRAGResponse = z.infer<typeof InkeepRAGResponseSchema>;
