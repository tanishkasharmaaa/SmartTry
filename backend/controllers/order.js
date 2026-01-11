const cartModel = require("../model/cart");
const orderModel = require("../model/order");
const productModel = require("../model/products");
const stockModel = require("../model/stocks");
const mongoose = require("mongoose");
const {addEmailJob} = require("../queue/emailQueue");

/* ------------------------------------------------------
 🧾 CREATE ORDER FROM CART
------------------------------------------------------ */
const createOrderFromCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.userId;
    const { cartId } = req.params;
    const { cartItemIds, paymentProvider = "COD" } = req.body;

    if (!Array.isArray(cartItemIds) || cartItemIds.length === 0) {
      return res.status(400).json({ message: "No cart items selected" });
    }

    const cart = await cartModel
      .findById(cartId)
      .populate({
        path: "items.productsId",
        populate: { path: "stockId" },
      })
      .session(session);

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const selectedItems = cart.items.filter((item) =>
      cartItemIds.includes(item._id.toString())
    );

    if (!selectedItems.length) {
      return res.status(400).json({ message: "Selected items not found" });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of selectedItems) {
      const product = item.productsId;
      const stockEntry = product.stockId;

      // ✅ SAFE SIZE
      let size = item.size;
      if (!size || typeof size !== "string") {
        size = "Free Size";
      } else {
        size =
          size.trim().toLowerCase() === "free size"
            ? "Free Size"
            : size.toUpperCase();
      }

      const availableStock = stockEntry.currentStock[size] ?? 0;
      if (availableStock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      stockEntry.currentStock[size] -= item.quantity;
      stockEntry.updatedStocks.push({
        size,
        previousStock: availableStock,
        newStock: stockEntry.currentStock[size],
        changeType: "REMOVE",
        reason: "Order placed from cart",
      });

      await stockEntry.save({ session });

      totalAmount += item.quantity * product.price;

      // ✅ PRODUCT SNAPSHOT (IMPORTANT)
      orderItems.push({
        productsId: product._id,
        productSnapshot: {
          name: product.name || product.title || "Product",
          price: product.price,
          image: product.image.trim() || product.images?.[0] || null,
        },
        quantity: item.quantity,
        priceAtOrder: product.price,
        size,
      });
    }

    const [order] = await orderModel.create(
      [
        {
          userId,
          items: orderItems,
          totalAmount,
          paymentStatus: "Pending",
          paymentProvider,
          orderStatus: "Processing",
          notifiedStatus: ["Processing"],
          trackingHistory: [
            { status: "Processing", message: "Order created, payment pending" },
          ],
        },
      ],
      { session }
    );

    // Remove ordered items from cart
    cart.items = cart.items.filter(
      (item) => !cartItemIds.includes(item._id.toString())
    );

    cart.totalAmount = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.productsId.price,
      0
    );

    await cart.save({ session });
    await session.commitTransaction();

    // ✅ EMAIL QUEUE (USE SNAPSHOT)
    await addEmailJob({
      type: "orderUpdate",
      to: req.user.email,
      orderId: order._id,
      status: "Processing",
      totalAmount: order.totalAmount,
      items: order.items.map((item) => ({
        name: item.productSnapshot.name,
        image: item.productSnapshot.image.trim(),
        quantity: item.quantity,
        size: item.size,
        price: item.productSnapshot.price,
      })),
      message: `Hi ${req.user.name || "Customer"}, your order #${order._id} has been created.`,
    });

    res.status(201).json({ message: "Order created", order });
  } catch (error) {
    await session.abortTransaction();
    console.error("Create Order From Cart Error:", error.message);
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};


/* ------------------------------------------------------
 🛍️ DIRECT BUY ORDER
------------------------------------------------------ */
const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = req.user.email;
    const userName = req.user.name || "Customer";

    const { productsId } = req.params;
    let { quantity = 1, size, paymentProvider = "COD" } = req.body;

    quantity = Number(quantity);
    if (quantity <= 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    // ✅ SAFE SIZE
    if (!size || typeof size !== "string") {
      size = "Free Size";
    } else {
      size =
        size.trim().toLowerCase() === "free size"
          ? "Free Size"
          : size.toUpperCase();
    }

    const product = await productModel.findById(productsId);
    const stockEntry = await stockModel.findOne({ productsId });

    if (!product || !stockEntry) {
      return res.status(404).json({ message: "Product or stock not found" });
    }

    const availableStock = stockEntry.currentStock?.[size] ?? 0;
    if (availableStock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    stockEntry.currentStock[size] -= quantity;
    await stockEntry.save();

    const order = await orderModel.create({
      userId,
      items: [
        {
          productsId: product._id,
          productSnapshot: {
            name: product.name || product.title || "Product",
            price: product.price,
            image: product.image.trim() || null,
          },
          quantity,
          priceAtOrder: product.price,
          size,
        },
      ],
      totalAmount: product.price * quantity,
      paymentStatus: "Pending",
      paymentProvider,
      orderStatus: "Processing",
      notifiedStatus: ["Processing"],
      trackingHistory: [
        { status: "Processing", message: "Order placed, payment pending" },
      ],
    });

    if (userEmail) {
      await addEmailJob({
        type: "orderUpdate",
        to: userEmail,
        orderId: order._id,
        status: "Processing",
        totalAmount: order.totalAmount,
        items: order.items.map((item) => ({
          name: item.productSnapshot.name,
          image: item.productSnapshot.image.trim(),
          quantity: item.quantity,
          size: item.size,
          price: item.productSnapshot.price,
        })),
        message: `Hi ${userName}, your order #${order._id} has been created.`,
      });
    }

    res.status(201).json({ message: "Order created", order });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



/* ------------------------------------------------------
 💳 MARK ORDER AS PAID (TEST MODE)
------------------------------------------------------ */
const markOrderAsPaid = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentStatus === "Paid")
      return res.status(400).json({ message: "Already paid" });

    order.paymentStatus = "Paid";
    order.paymentProvider = "COD";
    order.paymentId = `MOCK_${Date.now()}`;

    order.trackingHistory.push({
      status: "Paid",
      message: "Payment successful (Test Mode)",
    });

    await order.save();
    res.json({ message: "Payment successful", order });
  } catch (error) {
    res.status(500).json({ message: "Payment failed" });
  }
};

/* ------------------------------------------------------
 ❌ CANCEL ORDER
------------------------------------------------------ */
const cancelOrder = async (req, res) => {
  try {
    const { userId } = req.user;
    const { orderId } = req.params;

    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.userId.toString() !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    if (order.orderStatus === "Delivered")
      return res.status(400).json({ message: "Cannot cancel delivered order" });

    for (const item of order.items) {
      const stockEntry = await stockModel.findOne({
        productsId: item.productsId,
      });
      if (stockEntry) {
        stockEntry.currentStock[item.size] += item.quantity;
        stockEntry.updatedStocks.push({
          size: item.size,
          previousStock: stockEntry.currentStock[item.size] - item.quantity,
          newStock: stockEntry.currentStock[item.size],
          changeType: "ADD",
          reason: "Order cancelled",
        });
        await stockEntry.save();
      }
    }

    order.orderStatus = "Cancelled";
    order.paymentStatus =
      order.paymentStatus === "Paid" ? "Refunded" : "Pending";

    order.trackingHistory.push({
      status: "Cancelled",
      message: "Order cancelled",
    });

    await order.save();
    res.json({ message: "Order cancelled", order });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ------------------------------------------------------
 📦 GET ALL ORDERS
------------------------------------------------------ */
const getAllOrders = async (req, res) => {
  const orders = await orderModel
    .find({ userId: req.user.userId })
    .populate("items.productsId")
    .sort({ placedAt: -1 });

  res.json({ totalOrders: orders.length, orders });
};

/* ------------------------------------------------------
 🚚 TRACK ORDER
------------------------------------------------------ */
const trackOrderStatus = async (req, res) => {
  const order = await orderModel.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  res.json({
    currentStatus: order.orderStatus,
    history: order.trackingHistory,
  });
};

module.exports = {
  createOrderFromCart,
  createOrder,
  markOrderAsPaid,
  cancelOrder,
  getAllOrders,
  trackOrderStatus,
};
