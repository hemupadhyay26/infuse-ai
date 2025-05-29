import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Bedrock } from "@langchain/community/llms/bedrock";
import { getEmbeddings } from "./utils/helperFun.js";
import { PROMPT_TEMPLATE } from "./utils/promptTemplate.js";

const LLM_MODEL_ID = "anthropic.claude-v2";

export const queryRag = async (query, userId, onToken, stream = false) => {
  const embeddings = await getEmbeddings();

  const vectorStore = new Chroma(embeddings, {
    collectionName: `infuse-ai-${userId}`,
    url: process.env.CHROMA_URL || "http://localhost:8000",
    collectionMetadata: {
      "hnsw:space": "cosine",
    },
  });

  const results = await vectorStore.similaritySearch(query, 4);

  let contextArr = [];
  const sourcesInfo = [];
  results.forEach((doc, index) => {
    contextArr.push(`Result ${index + 1}: ${doc.pageContent}`);
    sourcesInfo.push(doc.id || "Unknown Source");
  });
  const context = contextArr.join("\n\n");

  const inputText = PROMPT_TEMPLATE.replace("{context}", context).replace(
    "{question}",
    query
  );

  const llm = new Bedrock({
    model: LLM_MODEL_ID,
    region: process.env.BEDROCK_AWS_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.BEDROCK_AWS_SECRET_ACCESS_KEY,
    },
    temperature: 0.2,
    maxTokens: 800,
    maxRetries: 2,
    streaming: stream,
  });

  if (stream) {
    const streamResponse = await llm.stream(inputText);
    let fullResponse = "";

    for await (const chunk of streamResponse) {
      if (chunk) {
        fullResponse += chunk;
        if (typeof onToken === "function") {
          onToken(chunk);
        }
      }
    }

    return {
      answer: fullResponse,
      sources: sourcesInfo,
    };
  } else {
    const llmResponse = await llm.invoke(inputText);

    return {
      answer: llmResponse,
      sources: sourcesInfo,
    };
  }
};