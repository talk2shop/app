const express = require("express");
const connectDB = require("./config/db");
const path = require("path");
const cors = require("cors");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const chalk = require("chalk");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const searchRoutes = require("./routes/search");
const chatRoutes = require("./routes/chatbot");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json({ limit: "5mb" }));

// static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGODB_URI)
  .then(() =>
    app.listen(PORT, () =>
      console.log(chalk.green.bold(`Server running on port ${PORT}`))
    )
  )
  .catch((err) => {
    console.log(chalk.white.bgRed.bold(" Database Connection Error: "), err);
    process.exit(1);
  });
