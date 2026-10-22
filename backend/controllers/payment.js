
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../model/order");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a Razorpay order for an existing SmartTry order
const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Confirm this order belongs to the logged-in user.
    // Adjust req.user.userId if your auth middleware uses another property.
    if (order.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (
      order.paymentProvider !== "RAZORPAY" ||
      order.paymentStatus !== "Pending"
    ) {
      return res.status(400).json({
        message: "This order is not eligible for Razorpay payment",
      });
    }

    if (order.razorpayOrderId) {
      return res.json({
        keyId: process.env.RAZORPAY_KEY_ID,
        razorpayOrderId: order.razorpayOrderId,
        amount: Math.round(order.totalAmount * 100),
        currency: "INR",
        orderId: order._id,
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: "INR",
      receipt: order._id.toString(),
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.status(201).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: order._id,
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    return res.status(500).json({
      message: "Unable to create payment order",
    });
  }
};

// Verify Razorpay's checkout signature before marking the order paid
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Missing payment verification details",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (order.paymentStatus === "Paid") {
      return res.json({ message: "Order is already paid" });
    }

    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        message: "Payment order does not match your SmartTry order",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const received = Buffer.from(razorpay_signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return res.status(400).json({
        message: "Payment signature verification failed",
      });
    }

    order.paymentStatus = "Paid";
    order.paymentProvider = "RAZORPAY";
    order.paymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;

    order.trackingHistory.push({
      status: order.orderStatus,
      message: "Payment verified successfully",
      updatedAt: new Date(),
    });

    await order.save();

    return res.json({ message: "Payment verified successfully" });
  } catch (error) {
    console.error("Verify Razorpay payment error:", error);
    return res.status(500).json({
      message: "Unable to verify payment",
    });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};
