import { config } from "dotenv";
config();
import { BedrockEmbeddings } from "@langchain/aws";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";


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
    const EMBEDDING_MODEL_ID = process.env.EMBEDDING_MODEL_ID || "amazon.titan-embed-text-v2:0";
    const embeddings = new BedrockEmbeddings({
        region: process.env.BEDROCK_AWS_REGION || "us-east-1",
        credentials: {
            accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.BEDROCK_AWS_SECRET_ACCESS_KEY || "",
        },
        model: EMBEDDING_MODEL_ID,
    });

    return embeddings;
}

export const loadDocuments = async (source) => {
    const documentLoader = new DirectoryLoader(source, {
        ".pdf": (path) => new PDFLoader(path),
    });

    return documentLoader.load();
}

export const split_documents = async (docs) => {
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const splitDocs = await textSplitter.splitDocuments(
        docs
    );

    return splitDocs;
}

// Helper to flatten metadata for Chroma
export const flattenMetadata = (metadata) => {
    const flat = {};
    for (const key in metadata) {
        if (
            typeof metadata[key] === 'string' ||
            typeof metadata[key] === 'number' ||
            typeof metadata[key] === 'boolean'
        ) {
            flat[key] = metadata[key];
        } else {
            flat[key] = JSON.stringify(metadata[key]);
        }
    }
    return flat;
};