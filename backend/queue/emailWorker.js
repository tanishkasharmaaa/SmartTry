// queue/emailWorker.js
const emailQueue = require("./emailQueue");
const { sendOrderUpdateEmail } = require("../utils/emailService");
const redis = require("../config/redis");

// Process 5 jobs concurrently
emailQueue.process(5, async (job) => {
  const { to, subject, message, productImage } = job.data;

  console.log("📩 Processing email job:", job.id, job.data);

  // Validate job data
  if (!to || !subject || !message) {
    console.error("❌ Missing required email fields:", job.data);
    throw new Error("Missing required email fields");
  }

  try {
    await sendOrderUpdateEmail({ to, subject, message, productImage });
    console.log(`✅ Email successfully sent to ${to}`);

    return { status: "sent", email: to };

  } catch (error) {
    console.error("❌ Email worker error:", error.message);

    // Throw error → Bull will retry based on `attempts` & `backoff`
    throw error;
  }
});

// Optional: Event listeners for debugging
emailQueue.on("failed", (job, err) => {
  console.error(`⚠️ Job ${job.id} failed:`, err.message);
});

emailQueue.on("completed", (job, result) => {
  console.log(`🎉 Job ${job.id} completed →`, result);
});
