import { QdrantClient } from "@qdrant/qdrant-js";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import dotenv from "dotenv";
// const { v4: uuidv4 } = require('uuid');
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: "../.env" });

const COLLECTION_NAME = "documents";
const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";

console.log("Connecting to Qdrant at:", QDRANT_URL);

let client;
try {
    client = new QdrantClient({
        url: QDRANT_URL,
        checkCompatibility: false,
        timeout: 10000
    });
} catch (error) {
    console.error("Failed to initialize Qdrant client:", error);
    throw error;
}

const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: "Xenova/all-MiniLM-L6-v2",
    dtype: "float32",
});

async function initCollection() {
    try {
        console.log("Getting collections...");
        const collections = await client.getCollections();
        const exists = collections.collections.some(c => c.name === COLLECTION_NAME);
        
        if (!exists) {
            console.log("Creating new collection...");
            await client.createCollection(COLLECTION_NAME, {
                vectors: {
                    size: 384,
                    distance: "Cosine"
                }
            });
            console.log(`Created collection: ${COLLECTION_NAME}`);
        } else {
            console.log(`Collection ${COLLECTION_NAME} already exists`);
        }
    } catch (error) {
        console.error("Error initializing collection:", error);
        if (error.message?.includes("ECONNREFUSED")) {
            throw new Error(`Failed to connect to Qdrant at ${QDRANT_URL}. Make sure Qdrant server is running.`);
        }
        throw error;
    }
}

export async function searchDocuments(query, limit = 5) {
    try {
        await initCollection();
        
        console.log("Generating embeddings for query...");
        const queryEmbedding = await embeddings.embedQuery(query);

        console.log("Searching documents...");
        const searchResult = await client.search(COLLECTION_NAME, {
            vector: queryEmbedding,
            limit: limit,
            with_payload: true
        });
        console.log("Searching finished...");
        return searchResult.map(hit => hit.payload?.content || "").filter(Boolean);
    } catch (error) {
        console.error("Error searching documents:", error);
        return [];
    }
}

export async function addDocument(content, id) {
    try {
        await initCollection();
        
        console.log("Generating embeddings for document...");
        const vector = await embeddings.embedQuery(content[0].content);
        
        console.log("Adding document to collection...");
        await client.upsert(COLLECTION_NAME, {
            points: [{
                id: id || uuidv4(),
                vector,
                payload: { content: content[0].content }
            }]
        });
        console.log("Document added successfully");
    } catch (error) {
        console.error("Error adding document:", error);
        throw error;
    }
}

export async function removeAllDocuments() {
    try {
        await initCollection();
        
        console.log("Removing all documents from collection...");
        await client.delete(
            COLLECTION_NAME,
            {
                filter: {
                    must: []
                }
            }
        );
        console.log("All documents removed from collection");
    } catch (error) {
        console.error("Error removing documents:", error);
        throw error;
    }
}

export { addDocument as addDocuments };
// export { searchDocuments };
