import { config } from "dotenv";
config();
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { flattenMetadata, getEmbeddings, loadDocuments, split_documents } from "./utils/helperFun.js";

const DATA_SOURCE = process.env.DATA_SOURCE || './src/data/source';

const addToChroma = async (chunks, embeddings) => {
    const vectorStore = new Chroma(embeddings, {
        collectionName: process.env.CHROMA_COLLECTION_NAME || "infuse-ai",
        url: process.env.CHROMA_URL || "http://localhost:8000",
        collectionMetadata: {
            "hnsw:space": "cosine",
        },
    })

    console.log('Adding documents to Chroma...');
    console.log('collectionName:', process.env.CHROMA_COLLECTION_NAME);

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
        const id = `${fileName}-p${pageNumber}-l${fromLine}-${toLine}`;
        return {
            pageContent: chunk.pageContent,
            metadata: meta,
            id
        };
    });
    const ids = cleanChunks.map(chunk => chunk.id);

    await vectorStore.addDocuments(cleanChunks, { ids });
}

const main = async () => {
    const document = await loadDocuments(DATA_SOURCE);
    const chunks = await split_documents(document);
    const embeddings = await getEmbeddings();
    addToChroma(chunks, embeddings);
}

await main()