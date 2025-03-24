import { client } from "./client";

/**
 * parseMultipleJSONObjects
 * Given a string with multiple JSON objects in a row, extract and parse them all.
 */
function parseMultipleJSONObjects(line: string): any[] {
	const objects: any[] = [];
	let bracketCount = 0;
	let startIndex = 0;
	let inObject = false;
  
	for (let i = 0; i < line.length; i++) {
	  const char = line[i];
  
	  if (char === '{') {
		bracketCount++;
		if (!inObject) {
		  // mark where the JSON object starts
		  startIndex = i;
		  inObject = true;
		}
	  } else if (char === '}') {
		bracketCount--;
		if (bracketCount === 0 && inObject) {
		  // we found a balanced object
		  const jsonString = line.substring(startIndex, i + 1);
		  objects.push(JSON.parse(jsonString));
		  inObject = false;
		}
	  }
	}
  
	return objects;
  }

//
// Single-tool configuration, from no-stream.ts
//
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

//
// Multi-tool configuration, from no-stream.ts
//
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
          "required": ["documentationGap"],
          "type": "object",
        },
      }
    },
    "type": "function",
  },
];

//
// Utility to render incremental (streamed) messages
//
const renderMessage = (snapshot: string) => {
  console.log("Content:", snapshot);
};

//
// Single-tool streaming example
//
async function getResponseFromAI() {
  // Create a stream runner with the single-tool definition
  const runner = client.beta.chat.completions.stream({
    model: "inkeep-qa-expert",
    messages: [{ role: "user", content: "How do I get started? Be succinct." }],
    tools: singleTool,
    store: true,
    // You can omit or specify 'tool_choice' if your backend requires it
    tool_choice: "auto",
  });

  runner.on("content", (delta, snapshot) => {
    // Stream partial content
    renderMessage(snapshot);
  });

  runner.on("tool_calls.function.arguments.done", (toolCall) => {
    const { name, arguments: args } = toolCall;
    // Example: parse and log the result
    if (name === "questionAnswered") {
      const parsedArguments = JSON.parse(args);
      console.log("Question answered tool call:", parsedArguments);
    }
  });
}

//
// Multi-tool streaming example
//
async function getResponseFromAIMultiTool() {
  // Create a stream runner with the multi-tool definition
  const runner = client.beta.chat.completions.stream({
    model: "inkeep-qa-expert",
    messages: [{ role: "user", content: "How do I get started? Be succinct." }],
    tools: multipleTools,
    store: true,
    tool_choice: "auto",
  });

  runner.on("content", (delta, snapshot) => {
    // Stream partial content
    renderMessage(snapshot);
  });

  runner.on("tool_calls.function.arguments.done", (toolCall) => {
	const { name, arguments: rawArgs } = toolCall;
  
	try {
	  // Attempt to parse multiple concatenated JSON objects
	  const parsedObjects = parseMultipleJSONObjects(rawArgs);
  
	  for (const parsedObject of parsedObjects) {
		switch (name) {
		  case "questionAnswered":
			console.log("Question answered tool call:", parsedObject);
			break;
		  case "identifyProduct":
			console.log("Identify product tool call:", parsedObject);
			break;
		  case "documentationGap":
			console.log("Documentation gap tool call:", parsedObject);
			break;
		  default:
			console.log("Unknown tool call name:", name, parsedObject);
		}
	  }
	} catch (err) {
	  console.error("Failed to parse multiple JSON objects in arguments:", rawArgs, err);
	}
  });
}

// Run the main functions as in no-stream.ts
console.log("Running getResponseFromAI (stream)...");
getResponseFromAI().catch((error) =>
  console.error("Error in getResponseFromAI:", error),
);

console.log("Running getResponseFromAIMultiTool (stream)...");
getResponseFromAIMultiTool().catch((error) =>
  console.error("Error in getResponseFromAIMultiTool:", error),
);