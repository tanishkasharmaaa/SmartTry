const cron = require("node-cron");
const orderModel = require("../model/order");
const { sendOrderUpdateEmail } = require("../services/sendSignupEmail");

const ORDER_FLOW = [
  "Processing",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

cron.schedule("*/2 * * * *", async () => {
  console.log("⏱ Checking orders for status updates...");

  try {
    const orders = await orderModel
      .find({
        orderStatus: { $nin: ["Delivered", "Cancelled"] }, // 🔐 HARD STOP
      })
      .populate("userId")
      .lean(false); // allow save()

    for (const order of orders) {
      // 🛑 Extra safety
      if (order.orderStatus === "Cancelled") continue;

      const currentIndex = ORDER_FLOW.indexOf(order.orderStatus);
      if (currentIndex === -1) continue;

      if (currentIndex >= ORDER_FLOW.length - 1) continue;

      const nextStatus = ORDER_FLOW[currentIndex + 1];

      // 🚫 Prevent duplicate email & duplicate history
      if (order.notifiedStatus?.includes(nextStatus)) {
        console.log(`⏭ Skipping ${order._id}, already notified`);
        continue;
      }

      // ✅ Update order
      order.orderStatus = nextStatus;
      order.updatedAt = new Date();

      order.notifiedStatus.push(nextStatus);
      order.trackingHistory.push({
        status: nextStatus,
        message: `Order moved to ${nextStatus}`,
        updatedAt: new Date(),
      });

      await order.save();

      console.log(`✅ Order ${order._id} → ${nextStatus}`);

      // 📧 SEND EMAIL (ONLY FOR NON-CANCELLED)
      if (order.userId?.email) {
        const itemsForEmail = order.items.map((item) => ({
          name: item.productSnapshot.name,
          image: item.productSnapshot.image,
          quantity: item.quantity,
          size: item.size,
          price: item.productSnapshot.price,
        }));

        await sendOrderUpdateEmail({
          to: order.userId.email,
          orderId: order._id,
          status: nextStatus,
          items: itemsForEmail,
          totalAmount: order.totalAmount,
          message: `Hi ${
            order.userId.name || "Customer"
          }, your order #${order._id} is now ${nextStatus}.`,
        });

        console.log(`📧 Email sent → ${order.userId.email}`);
      }
    }
  } catch (error) {
    console.error("❌ Cron Error:", error.message);
  }
});
