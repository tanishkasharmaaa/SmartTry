const mongoose = require("mongoose");
const reviewsModel = require("./reviews");

const productsScehma = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  sellerName: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "stocks",
    required: false,
  },
  tags:{type: [String], required:true},
  image: { type: String, required: true },
  gender: { type: String, enum: ["Men", "Women", "Unisex"], required: true },
  size: {
    type: String,
    enum: ["S", "M", "L", "XL", "XXL", "Free Size"],
    required: true,
  },
  reviewsId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reviews",
      required:false
    },
  ],
  averageRating: {
  type: Number,
  default: 0,
  min: 0,
  max: 5,
},

totalReviews: {
  type: Number,
  default: 0,
},
  createAt: { type: Date, default: Date.now },
});

productsScehma.pre("remove", async function (next) {
  try {
    await stockModel.deleteMany({ productsId: this._id });
    await reviewsModel.deleteMany({ productsId: this._id });
    next();
  } catch (error) {
    next(error);
  }
});


productsScehma.index({ category: 1 });
productsScehma.index({ brand: 1 });
productsScehma.index({ price: 1 });
productsScehma.index({ name: "text", description: "text" });

const productModel = mongoose.model("products", productsScehma);
module.exports = productModel;
