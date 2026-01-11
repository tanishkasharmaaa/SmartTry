const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  cancelOrder,
  createOrder,
  createOrderFromCart,
  getAllOrders,
  trackOrderStatus,
  markOrderAsPaid,
  getSingleOrder
} = require("../controllers/order");

const orderRouter = express.Router();

// 🛒 Create order from cart
orderRouter.post(
  "/buy-through-cart/:cartId",
  authMiddleware,
  createOrderFromCart
);

// 🛍️ Direct buy for a single product
orderRouter.post("/buy/:productsId", authMiddleware, createOrder);

// ❌ Cancel an order
orderRouter.patch("/cancel/:orderId", authMiddleware, cancelOrder);

// 🧾 Get all user orders
orderRouter.get("/", authMiddleware, getAllOrders);

orderRouter.get("/:orderId", authMiddleware, getSingleOrder);


// 🚚 Track order progress
orderRouter.get("/track/:orderId", authMiddleware, trackOrderStatus);

orderRouter.post("/orders/:orderId/pay", authMiddleware, markOrderAsPaid);




module.exports = orderRouter;
