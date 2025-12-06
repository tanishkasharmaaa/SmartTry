const express = require("express");
const cartRouter = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getAllCartItems,
  removeFromCart,
  updateCartItem,
  addToCart,
} = require("../controllers/cart");

cartRouter.get("/", authMiddleware, getAllCartItems);
cartRouter.post("/:productsId", authMiddleware, addToCart);
cartRouter.delete(
  "/remove-cartItem/:cartId/:cartItemId",
  authMiddleware,
  removeFromCart
);
cartRouter.patch(
  "/update-cartItem/:cartId/:cartItemId",
  authMiddleware,
  updateCartItem
);

module.exports = cartRouter;
