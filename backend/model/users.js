const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: { type: String },
  image: { type: String },
  birthday: { type: Date },

  gender: {
    type: String,
    enum: ["Male", "Female", "Unisex", ""],
  },

  bio: { type: String },

  // -------- SELLER --------
  seller: { type: Boolean, default: false },

  sellerInfo: {
    sellerName: { type: String },

    gstNumber: {
      type: String,
      validate: {
        validator: function (v) {
          if (this.seller) {
            return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(
              v
            );
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

  // -------- CART (IMPORTANT) --------
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "carts",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// -------- VALIDATION --------
usersSchema.pre("save", function (next) {
  if (
    this.seller &&
    (!this.sellerInfo ||
      !this.sellerInfo.sellerName ||
      !this.sellerInfo.gstNumber)
  ) {
    return next(
      new Error(
        "Seller info (sellerName and gstNumber) is required when seller is true"
      )
    );
  }
  next();
});


const userModel = mongoose.model("users", usersSchema);
module.exports = userModel;
