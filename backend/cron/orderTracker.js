const cron = require("node-cron");
const orderModel = require("../model/order");
const { sendOrderUpdateEmail } = require("../utils/emailService");

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
      .populate("items.productsId"); // ⭐ Needed to access product image

    for (let order of pendingOrders) {
      const currentIndex = ORDER_FLOW.indexOf(order.orderStatus);

      if (currentIndex < ORDER_FLOW.length - 1) {
        const nextStatus = ORDER_FLOW[currentIndex + 1];

        // 🚫 Prevent duplicate emails
        if (order.notifiedStatus.includes(nextStatus)) {
          console.log(`Skipping ${order._id}, already notified for: ${nextStatus}`);
          continue;
        }

        // ⭐ Get product image (first item)
        const firstItem = order.items[0];
        const productImage = firstItem?.productsId?.image || firstItem?.productsId?.images?.[0] || null;

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

        // 📧 Send Email
        if (order.userId?.email) {
          const subject = `Your order #${order._id} is now ${nextStatus}`;

          const message = `
Hi ${order.userId.name || "Customer"},  
Your order with ID ${order._id} is now **${nextStatus}**.`

          await sendOrderUpdateEmail(order.userId.email, subject, {
            message,
            productImage   // ⭐ Send image here
          });

          console.log(`Email sent → ${order.userId.email}`);
        }
      }
    }
  } catch (error) {
    console.log("Error updating orders:", error.message);
  }
});
