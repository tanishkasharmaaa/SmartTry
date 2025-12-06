const mongoose = require("mongoose");

const stocksSchema = new mongoose.Schema(
  {
    productsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    currentStock: {
      S: { type: Number, default: 0 },
      M: { type: Number, default: 0 },
      L: { type: Number, default: 0 },
      XL: { type: Number, default: 0 },
      XXL: { type: Number, default: 0 },
      "Free Size": { type: Number, default: 0 },
    },
    updatedStocks: [
      {
        size: {
          type: String,
          enum: ["S", "M", "L", "XL", "XXL", "Free Size"],
          required: true,
        },
        previousStock: { type: Number },
        newStock: { type: Number },
        changeType: {
          type: String,
          enum: ["ADD", "REMOVE", "UPDATE"],
          required: true,
        },
        reason: { type: String },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const stockModel = mongoose.model("stocks", stocksSchema);
module.exports = stockModel;
