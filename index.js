import { config } from "dotenv";
config();
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { BedrockEmbeddings } from "@langchain/aws";
import { Bedrock } from "@langchain/community/llms/bedrock";
import path from "path";

// Provide the path to the PDF file
const pdf = path.resolve("./datasource/");

const PROMPT_TEMPLATE = `
Human: Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
\nAssistant:
`;

// const LLM_MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0';
const LLM_MODEL_ID = "anthropic.claude-v2";

// const pdfloader = new PDFLoader(pdf);
const documentLoader = new DirectoryLoader(pdf, {
  ".pdf": (path) => new PDFLoader(path),
});

try {
  const queryRag = async (query) => {
    // Print the user query
    console.log("User query:", query);

    // Load the documents from the PDF
    const docs = await documentLoader.load();
    // console.log("Number of documents loaded:", docs.length);
    // console.log("First document content:", docs[0]);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splitDocs = await textSplitter.splitDocuments(
      docs.map((doc) => {
        const pdfName = path.basename(doc.metadata?.source || "Unknown.pdf");
        return {
          ...doc,
          metadata: {
            ...doc.metadata,
            pdfName,
          },
        };
      })
    );
    splitDocs.forEach((doc, index) => {
      const fromLine = doc.metadata?.loc.lines.from;
      const toLine = doc.metadata?.loc.lines.to;
      const pdfName = doc.metadata?.pdfName || "Unknown.pdf";
      doc.id = `${pdfName}:${fromLine}:${toLine}`;
    });
    // console.log("Number of split documents:", JSON.stringify(splitDocs[0], null, 2));
    // console.log("First split document content:", splitDocs[0]);
    // console.log("First split document metadata:", splitDocs.length);

    if (
      !process.env.BEDROCK_AWS_REGION ||
      !process.env.BEDROCK_AWS_ACCESS_KEY_ID ||
      !process.env.BEDROCK_AWS_SECRET_ACCESS_KEY
    ) {
      throw new Error(
        "Please set the AWS credentials in the environment variables."
      );
    }

    const embeddings = new BedrockEmbeddings({
      region: process.env.BEDROCK_AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.BEDROCK_AWS_SECRET_ACCESS_KEY || "",
      },
      model: "amazon.titan-embed-text-v2:0",
    });

    const vectorstore = await MemoryVectorStore.fromDocuments(
      splitDocs,
      embeddings
    );
    // console.log("Vector store created successfully.");

    // const query = "";
    const results = await vectorstore.similaritySearch(query, 3);
    // console.log("Query results:", results);

    // Construct the context from the vector store results
    const context = results
      .map((doc, index) => `Result ${index + 1}: ${doc.pageContent}`)
      .join("\n\n");

    // Extract sources from the results
    const sources = results.map((doc) => doc.id || "Unknown Source");

    // Prepare the messages for the Messages API
    const inputText = PROMPT_TEMPLATE.replace("{context}", context).replace(
      "{question}",
      query
    );
    // console.log("Prompt for LLM:", inputText);

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
    // console.log("LLM Response:", llmResponse);

    // Print the response and sources
    console.log(`\n\nResponse: ${llmResponse}\nSources: ${sources.join(", ")}\n\n`);
  };

  queryRag(
    "what is cost of deploying landing page?"
  );

  queryRag(
    "what is my lenskart order UNIT PRICE amount?"
  );


} catch (error) {
  console.error("Error loading PDF:", error);
}
