const cartModel = require("../model/cart");
const orderModel = require("../model/order");
const productModel = require("../model/products");
const stockModel = require("../model/stocks");
const mongoose = require("mongoose");

/* ------------------------------------------------------
 🧾 CREATE ORDER FROM CART
------------------------------------------------------ */
const createOrderFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cartId } = req.params;

    // Fetch cart
    const cart = await cartModel.findById(cartId).populate("items.productsId");
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    if (cart.items.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

    let totalAmount = 0;
    let orderItems = [];

    for (let item of cart.items) {
      totalAmount += item.quantity * item.priceAtAdd;

      const product = await productModel.findById(item.productsId);
      const stockEntry = await stockModel.findOne({
        productsId: item.productsId,
      });

      if (!product || !stockEntry)
        return res.status(404).json({
          message: `Stock entry not found for product ${item.productsId}`,
        });

      const availableStock = stockEntry.currentStock[item.size] ?? 0;

      if (availableStock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name} (Size: ${item.size})`,
        });
      }

      // Reduce stock
      stockEntry.currentStock[item.size] -= item.quantity;

      stockEntry.updatedStocks.push({
        size: item.size,
        previousStock: availableStock,
        newStock: stockEntry.currentStock[item.size],
        changeType: "REMOVE",
        reason: "Order placed from cart",
      });

      await stockEntry.save();

      orderItems.push({
        productsId: product._id,
        quantity: item.quantity,
        priceAtOrder: product.price,
        size: item.size,
      });
    }

    // Create Order
    const order = await orderModel.create({
      userId,
      items: orderItems,
      totalAmount,
      paymentStatus: "Pending",
      orderStatus: "Processing",
      notifiedStatus: ["Processing"], // first status notified
      trackingHistory: [
        { status: "Processing", message: "Order created successfully" },
      ],
    });

    // Clear cart
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("❌ Error creating order from cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


/* ------------------------------------------------------
 🛍️ DIRECT BUY ORDER
------------------------------------------------------ */
const createOrder = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productsId } = req.params;
    let { quantity, size } = req.body;

    size = size.trim().toLowerCase() === "free size" ? "Free Size" : size.toUpperCase();

    const product = await productModel.findById(productsId);
    const stockEntry = await stockModel.findOne({ productsId });

    if (!product || !stockEntry)
      return res.status(404).json({ message: "Product or stock not found" });

    if (!(size in stockEntry.currentStock)) {
      return res.status(400).json({
        message: `Invalid size '${size}'. Valid sizes: ${Object.keys(stockEntry.currentStock).join(", ")}`,
      });
    }

    const availableStock = stockEntry.currentStock[size];

    if (availableStock < quantity) {
      return res.status(400).json({
        message: `Insufficient stock for size ${size}`,
      });
    }

    // Reduce stock
    stockEntry.currentStock[size] -= quantity;

    stockEntry.updatedStocks.push({
      size,
      previousStock: availableStock,
      newStock: stockEntry.currentStock[size],
      changeType: "REMOVE",
      reason: "Direct purchase",
    });

    await stockEntry.save();

    // Create order
    const order = await orderModel.create({
      userId,
      items: [
        {
          productsId: product._id,
          quantity,
          priceAtOrder: product.price,
          size,
        },
      ],
      totalAmount: product.price * quantity,
      paymentStatus: "Pending",
      orderStatus: "Processing",
      notifiedStatus: ["Processing"],
      trackingHistory: [
        { status: "Processing", message: "Order placed successfully" },
      ],
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("❌ Error creating direct order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


/* ------------------------------------------------------
 ❌ CANCEL ORDER
------------------------------------------------------ */
const cancelOrder = async (req, res) => {
  try {
    const { userId } = req.user;
    const { orderId } = req.params;

    const order = await orderModel.findById(orderId).populate("items.productsId");
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.userId.toString() !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    if (order.orderStatus === "Cancelled")
      return res.status(400).json({ message: "Order already cancelled" });

    if (order.orderStatus === "Delivered")
      return res.status(400).json({ message: "Cannot cancel delivered order" });

    // Restore stock
    for (let item of order.items) {
      const product = await productModel.findById(item.productsId);
      const stockEntry = await stockModel.findOne({ productsId: item.productsId });

      if (product && stockEntry) {
        const previousStock = stockEntry.currentStock[item.size];
        stockEntry.currentStock[item.size] += item.quantity;

        stockEntry.updatedStocks.push({
          size: item.size,
          previousStock,
          newStock: stockEntry.currentStock[item.size],
          changeType: "ADD",
          reason: "Order cancelled",
        });

        await stockEntry.save();
      }
    }

    order.orderStatus = "Cancelled";
    order.paymentStatus = "Refunded";
    order.trackingHistory.push({
      status: "Cancelled",
      message: "Order was cancelled",
    });
    await order.save();

    res.status(200).json({
      message: "Order cancelled",
      order,
    });
  } catch (error) {
    console.error("❌ Error cancelling order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


/* ------------------------------------------------------
 📦 GET ALL ORDERS OF USER
------------------------------------------------------ */
const getAllOrders = async (req, res) => {
  try {
    const { userId } = req.user;

    const orders = await orderModel
      .find({ userId })
      .populate("items.productsId")
      .sort({ placedAt: -1 });

    if (!orders.length)
      return res.status(404).json({ message: "No orders found" });

    res.status(200).json({
      message: "Orders fetched successfully",
      totalOrders: orders.length,
      orders,
    });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


/* ------------------------------------------------------
 🚚 TRACK ORDER
------------------------------------------------------ */
const trackOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel.findById(orderId).populate("items.productsId");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const timeline = [
      { status: "Processing", estimatedTime: "10 mins" },
      { status: "Packed", estimatedTime: "20 mins" },
      { status: "Shipped", estimatedTime: "1 hour" },
      { status: "Out for Delivery", estimatedTime: "4–6 hours" },
      { status: "Delivered", estimatedTime: "Same day" },
    ];

    const index = timeline.findIndex(t => t.status === order.orderStatus);
    const nextStep = index < timeline.length - 1 ? timeline[index + 1] : null;

    res.status(200).json({
      message: "Tracking info fetched",
      orderId,
      currentStatus: order.orderStatus,
      nextStep,
      timeline,
      history: order.trackingHistory,
    });
  } catch (error) {
    console.error("❌ Error tracking order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


module.exports = {
  createOrderFromCart,
  createOrder,
  cancelOrder,
  getAllOrders,
  trackOrderStatus,
};
