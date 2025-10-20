// const DynamicTool = require("@langchain/core/tools");
// const PineconeStore = require("@langchain/pinecone");
// const GoogleGenrativeAIEmbeddings = require("@langchain/google-genai");
// const {
//   embeddingModel,
//   mongoose, //   pineconeIndex,
// } = require("../config/clients");
// const connectDB = require("../config/db");
// require("dotenv").config();

import { DynamicTool } from "langchain";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { mongoose, embeddingModel } from "../config/clients";
import { connectDB } from "../config/db";
require("dotenv").config();

export const getProductDetailsTool = new DynamicTool({
  name: "get_product_details",
  description:
    "Fetches dynamic details (price, stock, currency) for a product given its PRODUCT_ID",
  func: async (productId) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        console.warn(chalk.blue.bold("MongoDB not connected. Connecting..."));
        return "Database not ready, Please try again later.";
      }

      const db = connectDB();
      const productsCollection = db.collection("products");
      const product = await productsCollection.findOne({
        productId: productId,
      });

      if (product) {
        return JSON.stringify({
          productId: product.productId,
          name: product.name,
          price: product.price,
          stock: product.stock,
        });
      } else {
        return `Product with ID ${productId} not found.`;
      }
    } catch (error) {
      console.error("Error fetching product details from MongoDB:", error);
      return `Error fetching product details: $error.message}`;
    }
  },
});

export const searchKnowledgeBaseTool = new DynamicTool({
  name: "search_knowledge_base",
  description:
    "Searches the knowledge base for product description and general information based on a user query. Input should be a string representing the search query (e.g., 'shipping policy' or 'description of rtx graphic cards')",
  func: async (query) => {
    try {
      if (!embeddingModel) {
        throw new Error("Embedding model is not initialized.");
      }
      const vectorStore = await PineconeStore(
        new GoogleGenerativeAIEmbeddings({
          model: "gemini-embedding-001",
          apiKey: process.env.GEMINI_API_KEY,
        }),
        { pineconeIndex }
      );

      const result = await vectorStore.similaritySearch(query, 3);

      if (result.length > 0) {
        return result.map((doc) => doc.pageContent).join("\n");
      } else {
        return "No relevant result found in the knowledge base.";
      }
    } catch (error) {
      console.error(chalk.red.bold("Error searching knowledge base:"), error);
      return `Error searching knowledge base: ${error.message}`;
    }
  },
});

export const generalEnquiryTool = new DynamicTool({
  name: "general_query",
  description:
    "Use this tool for general questions that do not require specific product details. (price, stock) or knowledge base lookup(descriptions). The input is the user's general questions",
  func: async (query) => {
    return `The user is asking a general question: "${query}". Please provide a proper answer based on your general knowledge.`;
  },
});

export const chatbotTools = [
  getProductDetailsTool,
  searchKnowledgeBaseTool,
  generalEnquiryTool,
];
