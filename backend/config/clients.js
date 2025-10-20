// const GoogleGenerativeAI = require("@google/generative-ai");
// const Pinecone = require("@pinecone-database/pinecone");
// const mongoose = require("mongoose");
// const chalk = require("chalk");
// require("dotenv").config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import mongoose from "mongoose";
import chalk from chalk;
require("dotenv").config();

// --- Google Generative AI Client Setup ---
if (!process.env.GEMINI_API_KEY) {
  console.log(
    chalk.red.bold("Error: GEMINI_API_KEY is not set in environment variables.")
  );
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const embeddingModel = genAI.getGenerativeModel({
  model: "gemini-embedding-001",
});

// --- Pinecone Client Setup ---
if (!process.env.PINECONE_API_KEY) {
  throw new Error(
    chalk.red.bold("PINECONE_API_KEY is not set in environment variables.")
  );
}
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = "talk2shop";
const PINECONE_DIMENSION = 3072;
const PINECONE_CLOUD = "aws";
const PINECONE_REGION = "us-east-1";

const pc = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

export let pineconeIndex;
let indexInitialized = false;

export async function ensurePineconeIndex() {
  if (indexInitialized) {
    console.log(chalk.blue("Pinecone index already initialized."));
    return;
  }

  try {
    const indexes = await pc.listIndexes();
    const existing = indexes.indexes.find(
      (i) => i.name === PINECONE_INDEX_NAME
    );

    if (!existing) {
      console.log(
        chalk.yellow.bold(`Creating Pinecone index: ${PINECONE_INDEX_NAME}`)
      );
      await pc.createIndex({
        name: PINECONE_INDEX_NAME,
        dimension: PINECONE_DIMENSION,
        metric: "cosine",
        spec: {
          serverless: {
            cloud: PINECONE_CLOUD,
            region: PINECONE_REGION,
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
      console.log(
        chalk.green(`Pinecone index ${PINECONE_INDEX_NAME} created and ready!`)
      );
    } else {
      const desc = await pc.describeIndex(PINECONE_INDEX_NAME);
      if (desc.spec?.serverless) {
        console.log(
          chalk.yellow(
            `Pinecone index ${PINECONE_INDEX_NAME} already exists and is serverless.`
          )
        );
        if (desc.dimension !== PINECONE_DIMENSION) {
          throw new Error(
            `Existing index dimension (${desc.dimension}) does not match configured dimension (${PINECONE_DIMENSION}). Please delete it manually if you need to change the dimension.`
          );
        }
      } else {
        throw new Error(
          "Existing index is not serverless. Please delete it manually if you want to use serverless."
        );
      }
    }
    pineconeIndex = pc.Index(PINECONE_INDEX_NAME);
    indexInitialized = true;
  } catch (error) {
    console.error(chalk.red.bold("Error ensuring Pinecone index:"), error);
    throw error;
  }
}

module.exports = {
  genAI,
  model,
  embeddingModel,
  ensurePineconeIndex,
  mongoose,
};
