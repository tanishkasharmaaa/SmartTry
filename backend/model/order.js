const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },

  items: [
    {
      productsId: { type: mongoose.Schema.Types.ObjectId, ref: "products", required: true },
      productSnapshot: {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, default: null },
      },
      quantity: { type: Number, required: true },
      priceAtOrder: { type: Number, required: true },
      size: { type: String, default: "Free Size" },
    },
  ],

  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ["Pending", "Paid", "Refunded"], default: "Pending" },
  orderStatus: { type: String, enum: ["Processing", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"], default: "Processing" },
  notifiedStatus: { type: [String], default: [] },

  trackingHistory: [
    { status: String, message: String, updatedAt: { type: Date, default: Date.now } },
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

  paymentProvider: { type: String, enum: ["COD","UPI","CREDIT/DEBIT"], default: "COD" },
  paymentId: { type: String },

  // ✅ Add shortId for easy 8-char lookup
  shortId: { type: String, unique: true, index: true },
});

// ✅ Generate shortId automatically before saving
orderSchema.pre("save", function(next) {
  if (!this.shortId) {
    this.shortId = this._id.toString().slice(-8);
  }
  next();
});

module.exports = mongoose.model("orders", orderSchema);
