const express = require("express");
const cartRouter = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getAllCartItems,
  removeFromCart,
  updateCartItem,
  addToCart,
} = require("../controllers/cart");

// 📦 Get cart
cartRouter.get("/", authMiddleware, getAllCartItems);

// ➕ Add to cart
cartRouter.post("/:productsId", authMiddleware, addToCart);

// ❌ Remove item from cart
cartRouter.delete(
  "/remove-cartItem/:cartItemId",
  authMiddleware,
  removeFromCart
);

// ✏️ Update cart item (size / quantity)
cartRouter.patch(
  "/update-cartItem/:cartItemId",
  authMiddleware,
  updateCartItem
);

module.exports = cartRouter;

