import { config } from "dotenv";
config();
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { BedrockEmbeddings } from "@langchain/aws";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { TextLoader } from "langchain/document_loaders/fs/text";


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
        ".pdf": (path) => {
            console.log(`Processing PDF file: ${path}`);
            return new PDFLoader(path);
        },
        ".txt": (path) => {
            console.log(`Processing TXT file: ${path}`);
            return new TextLoader(path);
        },
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

export const addToChromaUserDB = async (chunks, embeddings, userId) => {
    const vectorStore = new Chroma(embeddings, {
        collectionName: `infuse-ai-${userId}`,
        url: process.env.CHROMA_URL || "http://localhost:8000",
        collectionMetadata: {
            "hnsw:space": "cosine",
        },
    });

    console.log('Adding documents to Chroma for user:', userId);

    // Generate ids based on pdf name, page number, and lines from/to
    const cleanChunks = chunks.map(chunk => {
        const meta = flattenMetadata(chunk.metadata);
        // Extract file name from source path
        const sourcePath = meta.source || '';
        const fileName = sourcePath.split('\\').pop().split('/').pop().replace(/\.[^/.]+$/, '');
        // Parse loc JSON
        let pageNumber = 'unknown';
        let fromLine = 'unknown';
        let toLine = 'unknown';
        try {
            const loc = JSON.parse(meta.loc);
            pageNumber = loc.pageNumber || 'unknown';
            if (loc.lines) {
                fromLine = loc.lines.from || 'unknown';
                toLine = loc.lines.to || 'unknown';
            }
        } catch (err) {
            console.error('Error parsing loc JSON:', err);
        }
        const id = `${userId}-${fileName}-p${pageNumber}-l${fromLine}-${toLine}`;
        return {
            pageContent: chunk.pageContent,
            metadata: meta,
            id
        };
    });
    const ids = cleanChunks.map(chunk => chunk.id);

    await vectorStore.addDocuments(cleanChunks, { ids });
    console.log('Documents added to Chroma for user:', userId);
}

export const processUploadFileByUser = async (userId, storedPath) => {
    const document = await loadDocuments(storedPath);
    const chunks = await split_documents(document);
    const embeddings = await getEmbeddings();
    addToChromaUserDB(chunks, embeddings, userId);
}
