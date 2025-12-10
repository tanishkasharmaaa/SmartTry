const emailQueue = require("./emailQueue");
const { sendOrderUpdateEmail } = require("../utils/emailService");

emailQueue.process(async (job) => {
  const { to, subject, message, productImage } = job.data;

  if (!to || !subject || !message) {
    console.log("❌ Email sending failed: Missing required email fields");
    return;
  }

  try {
    await sendOrderUpdateEmail({ to, subject, message, productImage });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Email worker error:", err);
    throw err;
  }
});
