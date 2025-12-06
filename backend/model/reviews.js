const mongoose = require("mongoose");

const reviewsSchema = new mongoose.Schema(
  {
    productsId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "products",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const reviewsModel = mongoose.model("reviews", reviewsSchema);

module.exports = reviewsModel;
