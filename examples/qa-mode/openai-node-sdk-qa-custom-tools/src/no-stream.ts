import { client } from "./client";

async function getResponseFromAI() {
	const singleTool = [
		{
			"function": {
				"name": "questionAnswered",
				"description": "Identify if the question has been answered.",
				"parameters": {
					"properties": {
						"questionAnswered": {
							"enum": [
								"Yes",
								"No",
							],
						}
					},
					"required": ["questionAnswered"],
					"type": "object",
				}
			},
			"type": "function",
		},
	  ];
	  
	  const completion = await client.chat.completions.create({
		  model: "inkeep-qa-expert",
		  messages: [{ role: "user", content: "How do I get started? Be succinct." }],
		  tools: singleTool,
		  store: true,
	  });

	  console.log(completion.choices[0].message.content);
	  console.log(completion.choices[0].message.tool_calls);
}

async function getResponseFromAIMultiTool() {
	const multipleTools = [
		{
			"function": {
				"name": "questionAnswered",
				"description": "Identify if the question has been answered.",
				"parameters": {
					"properties": {
						"questionAnswered": {
							"enum": [
								"Yes",
								"No",
							],
						}
					},
					"required": ["questionAnswered"],
					"type": "object",
				}
			},
			"type": "function",
		},
		{
			"function": {
				"name": "identifyProduct",
				"description": "Identify the product the user is asking about. Only provide an answer if the product is clear from the question and answer interaction.",
				"parameters": {
					"properties": {
						"productType": {
							"enum": [
								"AI for Customers",
								"AI for Support Teams",
								"Other",
							],
						}
					},
					"required": ["productType"],
					"type": "object",
				}
			},
			"type": "function",
		},
		{
			"function": {
				"name": "documentationGap",
				"description": "Identify what piece of information the user is asking about that is missing from the documentation and that the user is looking for. Only provide an answer if the chat bot provides no helpful information whatsoever.",
				"parameters": {
					"properties": {
						"documentationGap": {
							"type": "string",
							"description": "The piece of information the user is looking for that is missing from the documentation. e.g. 'How to index a document in a vector database', 'Information about Version 3.11.8 of the API', 'How to use the API to detect if a user is a bot', 'No Documentation Gap'",
						},
					},
					"required": ["documentationGap"],
					"type": "object",
				}
			},
			"type": "function",
		},        
	  ];
	  
	  const completion = await client.chat.completions.create({
		  model: "inkeep-qa-expert",
		  messages: [{ role: "user", content: "How do I get started? Be succinct." }],
		  tools: multipleTools,
		  store: true,
	  });

	  console.log(completion.choices[0].message.content);
	  console.log(completion.choices[0].message.tool_calls);
}

// Run the main function
console.log("Running getResponseFromAI...");
getResponseFromAI().catch((error) =>
	console.error("Error in getResponseFromAI:", error),
);
console.log("Running getResponseFromAIMultiTool...");
getResponseFromAIMultiTool().catch((error) =>
	console.error("Error in getResponseFromAIMultiTool:", error),
);
