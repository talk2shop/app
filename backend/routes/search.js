const express = require("express");
const router = express.Router();
const chalk = require("chalk");

const Product = require("../models/Product");
const { semanticSearch } = require("../services/searchService.js");

router.get("/", async (req, res) => {
  const q = req.query.q || "";
  const category = req.query.category || "";
  const subcategory = req.query.subcategory || "";
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  if (!q) {
    const filter = {};
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    const results = await Product.find(filter).skip(skip).limit(limit);
    return res.json(results);
  }

  try {
    const matches = await semanticSearch(q, {
      category,
      subcategory,
      topK: 50,
    });

    if (matches && matches.length) {
      const ids = matches.map((m) => m.id);
      const docs = await Product.find({ _id: { $in: ids } });

      // preserve order by Pinecone ranking
      const ordered = ids.map((id) =>
        docs.find((d) => d._id.toString() === id)
      );
      return res.json(ordered.slice(skip, skip + limit));
    }
    return res.json([]); // no matches
  } catch (error) {
    console.log(chalk.white.bgRed.bold(" Semantic search error: "), error);

    // fallback to MongoDB text search
    const results = await Product.find(
      {
        $text: { $search: q },
        ...(category ? { category } : {}),
        ...(subcategory ? { subcategory } : {}),
      },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(limit);

    return res.json(results);
  }
});

module.exports = router;
