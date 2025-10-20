const { Pinecone } = require("@pinecone-database/pinecone");
const { GoogleGenAI } = require("@google/genai");
const chalk = require("chalk");
require("dotenv").config();

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = "talk2shop";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// AI AND VECTOR DATABASE SETUP
const ai = new GoogleGenAI(GEMINI_API_KEY);
const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
let index = null;
let indexInitialized = false;

// Ensure Pinecone Index Exists & is Dense
async function ensureIndex() {
  const indexes = await pc.listIndexes();
  const existing = indexes.indexes.find((i) => i.name === PINECONE_INDEX_NAME);

  if (!existing) {
    console.log(
      chalk.yellow.bold(`Creating Pinecone index: ${PINECONE_INDEX_NAME}`)
    );
    await pc.createIndex({
      name: PINECONE_INDEX_NAME,
      dimension: 3072,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
    });
    let ready = false;
    while (!ready) {
      const desc = await pc.describeIndex(PINECONE_INDEX_NAME);
      if (desc.status?.ready) ready = true;
      else {
        console.log(chalk.yellow("Waiting for index to be ready..."));
        await new Promise((res) => setTimeout(res, 5000));
      }
    }
    console.log(chalk.green(`Pinecone index ${PINECONE_INDEX_NAME} created!`));
  } else {
    const desc = await pc.describeIndex(PINECONE_INDEX_NAME);
    if (desc.spec?.serverless) {
      console.log(
        chalk.yellow(
          `Pinecone index ${PINECONE_INDEX_NAME} already exists and is serverless`
        )
      );
    } else {
      throw new Error(
        "Existing index is not serverless. Please delete it manually."
      );
    }
  }
  index = pc.index(PINECONE_INDEX_NAME);
  indexInitialized = true;
}

// EMBEDDING FUNCTION
async function getEmbedding(text) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });
  return response.embeddings[0].values;
}

// VECTORDB INSERTION
async function indexProduct(product) {
  if (!indexInitialized) {
    await ensureIndex();
  }

  const { _id, title, description, category, subcategory } = product;
  const text = `${title} ${description || ""} ${category || ""} ${
    subcategory || ""
  }`;
  const embedding = await getEmbedding(text);

  await index.upsert([
    {
      id: _id.toString(),
      values: embedding,
      metadata: {
        title,
        description,
        category,
        subcategory,
      },
    },
  ]);
  return { success: true };
}

// SEMANTIC SEARCH with category & subcategory filter
async function semanticSearch(query, { category, subcategory, topK = 5 } = {}) {
  if (!indexInitialized) {
    await ensureIndex();
  }

  if (!query || !query.trim()) return [];

  const embedding = await getEmbedding(query);

  const res = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter: {
      ...(category ? { category } : {}),
      ...(subcategory ? { subcategory } : {}),
    },
  });

  return (res.matches || []).map((match) => ({
    id: match.id,
    score: match.score,
    ...match.metadata,
  }));
}

// Initialize index on module load
ensureIndex().catch(console.error);

module.exports = { indexProduct, semanticSearch, ensureIndex };
