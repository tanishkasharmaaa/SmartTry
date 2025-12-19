const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },

  items: [
    {
      productsId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true,
      },
      quantity: { type: Number, required: true },
      priceAtOrder: { type: Number, required: true },
      size: { type: String },
    },
  ],

  totalAmount: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Refunded"],
    default: "Pending",
  },
  orderStatus: {
    type: String,
    enum: [
      "Processing",
      "Packed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ],
    default: "Processing",
  },

  notifiedStatus: {
    type: [String],
    default: [],
  },

  trackingHistory: [
    {
      status: { type: String },
      message: { type: String },
      updatedAt: { type: Date, default: Date.now },
    },
  ],

  deliveryAddress: {
    name: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
  },

  placedAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date },
  paymentProvider: {
    type: String,
    enum: ["mock", "razorpay", "stripe"],
    default: "mock",
  },
  paymentId: {
    type: String,
  },
});

module.exports = mongoose.model("orders", orderSchema);
