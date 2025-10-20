const express = require("express");
const router = express.Router();
const chalk = require("chalk");

const product = require("../models/Product");
const auth = require("../middlewares/auth");
const adminOnly = require("../middlewares/adminOnly");
const validate = require("../middlewares/validate");
const {
  createProduct,
  updateProduct,
} = require("../validators/productSchemas");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { indexProduct, semanticSearch } = require("../services/searchService");

// Multer memory storage (no disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = async (fileBuffer, filename) => {
  const result = await cloudinary.uploader.upload_stream({
    folder: "products",
    public_id: filename,
  });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "products", public_id: filename },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

// --- GET product by ID ---
router.get("/:id", async (req, res) => {
  try {
    const p = await product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Product not found" });
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- GET list of products ---
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;
    const products = await product
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Semantic Search ---
router.get("/semantic", async (req, res) => {
  try {
    const { q, category, subcategory, topK } = req.query;
    if (!q) return res.status(400).json({ message: "Query is required" });

    const results = await semanticSearch(q, {
      category,
      subcategory,
      topK: Number(topK) || 5,
    });

    res.json({ query: q, count: results.length, results });
  } catch (err) {
    console.error(chalk.white.bgRed.bold(" Semantic Search Error: "), err);
    res.status(500).json({ message: "Search failed" });
  }
});

// --- CREATE product ---
router.post(
  "/",
  auth,
  adminOnly,
  upload.array("images", 6),
  validate(createProduct),
  async (req, res) => {
    try {
      const data = req.validated.body;

      // Upload each file buffer to Cloudinary
      const images = [];
      for (const file of req.files || []) {
        const url = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "products", public_id: Date.now().toString() },
            (err, result) => (err ? reject(err) : resolve(result.secure_url))
          );
          stream.end(file.buffer);
        });
        images.push(url);
      }

      const prod = new product({ ...data, images });
      const savedProduct = await prod.save();
      await indexProduct(savedProduct);
      savedProduct.vectorId = savedProduct._id.toString();
      await savedProduct.save();

      res.status(201).json(savedProduct);
    } catch (err) {
      console.error(chalk.white.bgRed.bold(" Create Product Error: "), err);
      res.status(500).json({ message: err.message });
    }
  }
);

// --- UPDATE product ---
router.put(
  "/:id",
  auth,
  adminOnly,
  upload.array("images", 6),
  validate(updateProduct),
  async (req, res) => {
    try {
      const update = req.validated.body;

      if (req.files && req.files.length) {
        const existing = await product.findById(req.params.id);

        // Delete old images from Cloudinary
        if (existing?.images) {
          for (const url of existing.images) {
            const parts = url.split("/");
            const publicIdWithExt = parts.slice(-1)[0];
            const publicId = `products/${publicIdWithExt.split(".")[0]}`;
            await cloudinary.uploader.destroy(publicId);
          }
        }

        // Upload new images
        const images = [];
        for (const file of req.files) {
          const url = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "products", public_id: Date.now().toString() },
              (err, result) => (err ? reject(err) : resolve(result.secure_url))
            );
            stream.end(file.buffer);
          });
          images.push(url);
        }
        update.images = images;
      }

      update.updatedAt = Date.now();
      const updatedProduct = await product.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true }
      );

      if (updatedProduct) await indexProduct(updatedProduct);
      res.json(updatedProduct);
    } catch (err) {
      console.error(chalk.white.bgRed.bold(" Update Product Error: "), err);
      res.status(500).json({ message: err.message });
    }
  }
);

// --- DELETE product ---
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const p = await product.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ message: "Product not found" });

    // Remove images from Cloudinary
    if (p.images) {
      for (const url of p.images) {
        const parts = url.split("/");
        const publicIdWithExt = parts.slice(-1)[0];
        const publicId = `products/${publicIdWithExt.split(".")[0]}`;
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await index.deleteOne(p._id.toString());
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(chalk.white.bgRed.bold(" Delete Product Error: "), err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
