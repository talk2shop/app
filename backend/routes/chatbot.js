const express = require("express");
const chalk = require("chalk");
const router = express.Router();
const askChatbot = require("../services/chatbotServices");
router.post("/chat", async (req, res) => {
  const message = req.body;

  if (!message) {
    res.status(400).send("Message is required.");
  }

  try {
    console.log(chalk.red.bold("Chatbot message received:"), message);
    const response = await askChatbot(message);
    res.json({ reply: response });
  } catch (error) {
    console.error(chalk.red.bold("Error in chatbot route:"), error);
    res
      .status(500)
      .send({ error: "Internal server error while processing the request." });
  }
});

module.exports = router;
