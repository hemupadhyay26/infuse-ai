import { Chroma } from "@langchain/community/vectorstores/chroma";
import { BedrockEmbeddings } from "@langchain/aws";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { formatDateTime } from "./formatDateTime.js";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";

// Helper to get embeddings
export const getEmbeddings = async () => {
  if (
    !process.env.BEDROCK_AWS_REGION ||
    !process.env.BEDROCK_AWS_ACCESS_KEY_ID ||
    !process.env.BEDROCK_AWS_SECRET_ACCESS_KEY
  ) {
    throw new Error(
      "Please set the AWS credentials in the environment variables."
    );
  }
  const EMBEDDING_MODEL_ID =
    process.env.EMBEDDING_MODEL_ID || "amazon.titan-embed-text-v2:0";
  const embeddings = new BedrockEmbeddings({
    region: process.env.BEDROCK_AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.BEDROCK_AWS_SECRET_ACCESS_KEY || "",
    },
    model: EMBEDDING_MODEL_ID,
  });

  return embeddings;
};

export const loadDocuments = async (source) => {
  const documentLoader = new DirectoryLoader(source, {
    ".pdf": (path) => {
      return new PDFLoader(path);
    },
    ".txt": (path) => {
      return new TextLoader(path);
    },
  });

  return documentLoader.load();
};

// Helper to split documents into chunks
export const split_documents = async (docs) => {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splitDocs = await textSplitter.splitDocuments(docs);

  return splitDocs;
};

// Helper to flatten metadata for Chroma
export const flattenMetadata = (metadata) => {
  const flat = {};
  for (const key in metadata) {
    if (
      typeof metadata[key] === "string" ||
      typeof metadata[key] === "number" ||
      typeof metadata[key] === "boolean"
    ) {
      flat[key] = metadata[key];
    } else {
      flat[key] = JSON.stringify(metadata[key]);
    }
  }
  return flat;
};

// Add documents to Chroma vector store
export const addToChromaUserDB = async (chunks, embeddings, userId) => {
  const vectorStore = new Chroma(embeddings, {
    collectionName: `infuse-ai-${userId}`,
    url: process.env.CHROMA_URL || "http://localhost:8000",
    collectionMetadata: {
      "hnsw:space": "cosine",
    },
  });

  const cleanChunks = chunks.map((chunk) => {
    const meta = flattenMetadata(chunk.metadata);
    const sourcePath = meta.source || "";
    const fileName = sourcePath
      .split("\\")
      .pop()
      .split("/")
      .pop()
      .replace(/\.[^/.]+$/, "");
    let pageNumber = "unknown";
    let fromLine = "unknown";
    let toLine = "unknown";
    try {
      const loc = JSON.parse(meta.loc);
      pageNumber = loc.pageNumber || "unknown";
      if (loc.lines) {
        fromLine = loc.lines.from || "unknown";
        toLine = loc.lines.to || "unknown";
      }
    } catch (err) {
      console.error("Error parsing loc JSON:", err);
    }
    // Add fileId to metadata for robust filtering
    meta.fileId = fileName;
    const id = `${userId}-${fileName}-p${pageNumber}-l${fromLine}-${toLine}`;
    return {
      pageContent: chunk.pageContent,
      metadata: meta,
      id,
    };
  });
  const ids = cleanChunks.map((chunk) => chunk.id);

  await vectorStore.addDocuments(cleanChunks, { ids });
  console.log("Documents added to Chroma for user:", userId, formatDateTime());
};

export const processUploadFileByUser = async (userId, storedPath) => {
  const document = await loadDocuments(storedPath);
  const chunks = await split_documents(document);
  const embeddings = await getEmbeddings();
  addToChromaUserDB(chunks, embeddings, userId);
};

// Delete all vectors for a file from Chroma vector store
export const deleteFromChromaUserDB = async (userId, fileId) => {
  const embeddings = await getEmbeddings();
  const vectorStore = new Chroma(embeddings, {
    collectionName: `infuse-ai-${userId}`,
    url: process.env.CHROMA_URL || "http://localhost:8000",
  });

  // Use retriever with filter to get only chunks for this fileId
  const retriever = vectorStore.asRetriever(
    { k: 1000 }, // get up to 1000 chunks
    { fileId }   // filter: only chunks with metadata.fileId === fileId
  );

  let docs = [];
  try {
    docs = await retriever.invoke(fileId); // query string doesn't matter, filter is applied
  } catch (err) {
    console.error("Error retrieving chunks from Chroma:", err);
    return;
  }

  const idsToDelete = (docs || [])
    .map((doc) => doc.id)
    .filter(Boolean);

  if (idsToDelete.length > 0) {
    await vectorStore.delete({ ids: idsToDelete });
    console.log(
      `Deleted ${idsToDelete.length} vectors from Chroma for user ${userId} and file ${fileId}`
    );
  } else {
    console.log(
      `No vectors found in Chroma for user ${userId} and file ${fileId}`
    );
  }
};
