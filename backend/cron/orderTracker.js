const cron = require("node-cron");
const orderModel = require("../model/order");
const { sendOrderUpdateEmail } = require("../services/sendSignupEmail");

const ORDER_FLOW = [
  "Processing",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered"
];

cron.schedule("*/2 * * * *", async () => {
  console.log("Checking pending orders for status updates...");

  try {
    const pendingOrders = await orderModel.find({
      orderStatus: { $nin: ["Delivered", "Cancelled"] }
    })
      .populate("userId")
      .populate("items.productsId"); // ⭐ Needed to access product details

    for (let order of pendingOrders) {
      const currentIndex = ORDER_FLOW.indexOf(order.orderStatus);

      if (currentIndex < ORDER_FLOW.length - 1) {
        const nextStatus = ORDER_FLOW[currentIndex + 1];

        // 🚫 Prevent duplicate emails
        if (order.notifiedStatus.includes(nextStatus)) {
          console.log(`Skipping ${order._id}, already notified for: ${nextStatus}`);
          continue;
        }

        // Update order
        order.orderStatus = nextStatus;
        order.updatedAt = Date.now();

        order.notifiedStatus.push(nextStatus);

        order.trackingHistory.push({
          status: nextStatus,
          message: `Order moved to ${nextStatus}`,
          updatedAt: new Date()
        });

        await order.save();

        console.log(`Order ${order._id} updated → ${nextStatus}`);

        // 📧 Send Email with full order details
        if (order.userId?.email) {
          const itemsForEmail = order.items.map((item) => ({
            name: item.productsId.name,
            image: item.productsId.image.trim() || item.productsId.images?.[0] || null,
            quantity: item.quantity,
            size: item.size,
            price: item.priceAtOrder
          }));

          const message = `Hi ${order.userId.name || "Customer"}, your order with ID ${order._id} is now **${nextStatus}**.`;

          await sendOrderUpdateEmail({
            to: order.userId.email,
            orderId: order._id,
            status: nextStatus,
            items: itemsForEmail,
            totalAmount: order.totalAmount,
            message
          });

          console.log(`Email sent → ${order.userId.email}`);
        }
      }
    }
  } catch (error) {
    console.error("Error updating orders:", error);
  }
});
