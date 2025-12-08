const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  image: { type: String },
  birthday: { type: Date },
  gender: { type: String, enum: ["Male", "Female", "Unisex",""] },
  bio: { type: String },
  seller: { type: Boolean, default: false },
  sellerInfo: {
    sellerName: { type: String },
     gstNumber: {
  type: String,
  validate: {
    validator: function (v) {
      if (this.seller) {
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(v);
      }
      return true;
    },
    message: "Invalid GST Number format",
  },
  required: function () {
    return this.seller;
  },
},

    businessName: { type: String },
    businessAddress: { type: String },
    contactNumber: { type: String },
    website: { type: String },
    description: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

usersSchema.pre("save", function (next) {
  if (
    this.seller &&
    (this.sellerInfo == null ||
      this.sellerInfo.sellerName == null ||
      this.sellerInfo.gstNumber == null)
  ) {
    return next(
      new Error(
        " Seller info (sellereName and gstNumber) is required when seller is true"
      )
    );
  }
  next();
});

usersSchema.pre("remove", async (next) => {
  try {
    console.log(`Deleting all the products of seller: ${this.id}`);
    await productModel.deleteMany({ sellerId: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

const userModel = mongoose.model("users", usersSchema);
module.exports = userModel;
