
const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../controllers/payment");

const paymentRouter = express.Router();

paymentRouter.post(
  "/create-order",
  authMiddleware,
  createRazorpayOrder
);

paymentRouter.post(
  "/verify",
  authMiddleware,
  verifyRazorpayPayment
);

module.exports = paymentRouter;
