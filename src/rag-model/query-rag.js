
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Bedrock } from "@langchain/community/llms/bedrock";
import { getEmbeddings } from "./utils/helperFun.js";

const PROMPT_TEMPLATE = `
Human: Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
\nAssistant:
`;

const LLM_MODEL_ID = "anthropic.claude-v2";

export const queryRag = async (query, userId) => {
  const embeddings = await getEmbeddings();

  const vectorStore = new Chroma(embeddings, {
    collectionName: `infuse-ai-${userId}`,
    url: process.env.CHROMA_URL || "http://localhost:8000",
    collectionMetadata: {
      "hnsw:space": "cosine",
    },
  })

  const results = await vectorStore.similaritySearch(query, 3);

  // Construct the context and sourcesInfo in a single traversal
  let contextArr = [];
  const sourcesInfo = [];
  results.forEach((doc, index) => {
    contextArr.push(`Result ${index + 1}: ${doc.pageContent}`);
    sourcesInfo.push(doc.id || "Unknown Source");
  });
  const context = contextArr.join("\n\n");

  // Prepare the messages for the Messages API
  const inputText = PROMPT_TEMPLATE.replace("{context}", context).replace(
    "{question}",
    query
  );

  // Initialize the LLM model
  const llm = new Bedrock({
    model: LLM_MODEL_ID,
    region: process.env.BEDROCK_AWS_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.BEDROCK_AWS_SECRET_ACCESS_KEY,
    },
    temperature: 0,
    maxTokens: 512,
    maxRetries: 2,
  });
  // Send the messages to the LLM
  const llmResponse = await llm.invoke(inputText);

  return {
    answer: llmResponse,
    sources: sourcesInfo,
  };
};


