"use client";

import { useChat } from "ai/react";
import { useState } from "react";
import type { InkeepRAGResponse } from "@/lib/chat/inkeep-rag-schema";

export default function Page() {
  const { messages, isLoading, input, handleSubmit, handleInputChange } =
    useChat({
      streamMode: "object",
      sendExtraMessageFields: true,
      onResponse(response) {
        if (response.status === 401) {
          console.error(response.statusText);
        }
      },
    });

  const [ragResponses, setRagResponses] = useState<Record<string, InkeepRAGResponse>>({});

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const message = formData.get("message") as string;
    
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: message }],
      }),
    });
    
    const data = await response.json();
    setRagResponses((prev) => ({
      ...prev,
      [message]: data,
    }));
  };

  return (
    <div className="flex flex-col p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Inkeep RAG API Example</h1>
      
      <form onSubmit={handleFormSubmit} className="mb-4">
        <input
          name="message"
          placeholder="Ask a question..."
          value={input}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          {isLoading ? "Loading..." : "Send"}
        </button>
      </form>

      <div className="space-y-4">
        {Object.entries(ragResponses).map(([question, response]) => (
          <div key={question} className="border p-4 rounded">
            <p className="font-bold">Question: {question}</p>
            <div className="mt-2">
              <p className="font-semibold">RAG Documents:</p>
              {response.content.map((doc, index) => (
                <div key={index} className="mt-2 p-2 bg-gray-100 rounded">
                  <p><strong>Title:</strong> {doc.title || "N/A"}</p>
                  <p><strong>URL:</strong> {doc.url || "N/A"}</p>
                  <p><strong>Context:</strong> {doc.context || "N/A"}</p>
                  <p><strong>Source Type:</strong> {doc.source_type || "N/A"}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
