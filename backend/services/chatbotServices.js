// const { AgentExecutor, createReactAgent } = require("@langchain/community");
// const { ChatPromptTemplate } = require("@langchain/core/prompts");
// const model = require("../config/clients");
// const chatbotTools = require("./chatbotTools");
// require("dotenv").config();

import { AgentExecutor, createReactAgent } from "@langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import model from "../config/clients";
import chatbotTools from "./chatbotTools";
require("dotenv").config();

export const chatPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a helpful e-commerce chatbot assistant for an online store.
  You can provide product information, prices, and stock levels.
  
  **Instructions for Tool Usage:**
  1.  **Product Price/Stock:** If the user asks about the price or stock of a specific product, always try to use the \`getProductDetails\` tool. You MUST extract a clear 'productId' (e.g., 'prod-001', 'prod-002') from the user's query to use this tool. If you cannot find a product ID, state that you need one.
  2.  **Product Descriptions/FAQs/General Info:** If the user asks for a product description, details about a product (but not price/stock), or general store information (like shipping, returns, payment methods), use the \`searchKnowledgeBase\` tool.
  3.  **General Questions:** For any other general questions that don't fit the above categories, use the \`generalInquiry\` tool.
  
  **Response Guidelines:**
  *   Be friendly and helpful.
  *   If a tool returns "not found", politely inform the user.
  *   Always try to provide a concise and direct answer.
  *   If you use \`getProductDetails\`, clearly state the price and stock.
  *   If you use \`searchKnowledgeBase\`, summarize the relevant information.
  *   If you cannot fulfill a request, ask for clarification or offer alternative help.
  `,
  ],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
]);

export const agent = createReactAgent({
  llm: model,
  tools: chatbotTools,
  chatPrompt,
});

export const agentExecutor = new AgentExecutor({
  agent,
  tools: chatbotTools,
  verbose: true,
});

export const askChatbot = async (question) => {
  try {
    const result = agentExecutor.invoke({
      input: question,
    });
    return result.output;
  } catch (error) {
    console.error(chalk.red.bold("Error in chatbot agent:"), error);
    return "I apologize, but I encountered an error while processing your requests. Please try again later";
  }
};
