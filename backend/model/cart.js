const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  productsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "products",
    required: true,
  },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  size: { type: String, enum: ["S", "M", "L", "XL", "XXL", "Free Size"] },
  priceAtAdd: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now },
});

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const cartModel = mongoose.model("cart", cartSchema);

module.exports = cartModel;
