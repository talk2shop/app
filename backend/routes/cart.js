const express = require("express");
const router = express.Router();
const chalk = require("chalk");

const auth = require("../middlewares/auth");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const validate = require("../middlewares/validate");
const { createCart, addItem } = require("../validators/cartSchemas");

// all carts for user
router.get("/", auth, async (req, res) => {
  const carts = await Cart.find({ user: req.user._id }).populate(
    "items.product"
  );
  res.status(200).json(carts);
});

// get specific cart by name
router.get("/:cartName", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user._id,
      name: req.params.cartName,
    }).populate("items.product");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error(chalk.white.bgRed.bold(`Error fetching cart: ${error}`));
    res.status(500).json({ message: "Internal server error" });
  }
});

// create new cart for user
router.post("/", auth, validate(createCart), async (req, res) => {
  const { name } = req.validated.body;
  const exists = await Cart.findOne({ user: req.user._id, name });
  if (exists) return res.status(400).json({ message: "Cart already exists" });
  const newCart = new Cart({ user: req.user._id, name, items: [] });
  await newCart.save();
  res.status(201).json(newCart);
});

// add item to cart
router.post("/add", auth, validate(addItem), async (req, res) => {
  try {
    const {
      cartName = "default",
      product: productId,
      quantity,
    } = req.validated.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        message: "Out of stock",
        availableStock: product.stock,
        requestedQuantity: quantity,
      });
    }

    let cart = await Cart.findOne({ user: req.user._id, name: cartName });
    if (!cart) {
      cart = new Cart({ user: req.user._id, name: cartName, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex >= 0) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (product.stock < newQuantity) {
        return res.status(400).json({
          message: "Total quantity exceeds available stock",
          availableStock: product.stock,
          currentInCart: cart.items[existingItemIndex].quantity,
          requestedQuantity: quantity,
        });
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      "items.product"
    );
    res.status(200).json({
      message:
        existingItemIndex >= 0
          ? "Item quantity updated in cart"
          : "Item added to cart",
      cart: populatedCart,
    });
  } catch (error) {
    console.error(
      chalk.white.bgRed.bold(`Error adding item to cart: ${error}`)
    );
    res.status(500).json({ message: "Internal server error" });
  }
});

// remove item
router.post("/remove", auth, async (req, res) => {
  try {
    const { cartName = "default", product: productId } = req.body;
    const cart = await Cart.findOne({ user: req.user._id, name: cartName });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      "items.product"
    );
    res.status(200).json({
      message: "Item removed from cart",
      cart: populatedCart,
    });
  } catch (error) {
    console.error(
      chalk.white.bgRed.bold(`Error removing item from cart: ${error}`)
    );
    res.status(500).json({ message: "Internal server error" });
  }
});

// update item quantity in cart
router.put("/update-quantity", auth, async (req, res) => {
  try {
    const { cartName = "default", product: productId, quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ user: req.user._id, name: cartName });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        message: "Requested quantity exceeds available stock",
        availableStock: product.stock,
        requestedQuantity: quantity,
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      "items.product"
    );
    res.status(200).json({
      message: "Item quantity updated",
      cart: populatedCart,
    });
  } catch (error) {
    console.error(
      chalk.white.bgRed.bold(`Error updating item quantity in cart: ${error}`)
    );
    res.status(500).json({ message: "Internal server error" });
  }
});

// delete cart
router.delete("/:name", auth, async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user._id, name: req.params.name });
  res.status(200).json({ message: "Cart deleted" });
});

module.exports = router;
