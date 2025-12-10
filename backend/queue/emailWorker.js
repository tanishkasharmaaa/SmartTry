// queue/emailWorker.js
const emailQueue = require("./emailQueue");
const { sendOrderUpdateEmail } = require("../utils/emailService");

emailQueue.process(async (job) => {
  try {
    console.log("Processing email job:", job.data);

    await sendOrderUpdateEmail(job.data);

    console.log(`✅ Email job completed for ${job.data.to}`);
  } catch (error) {
    console.error("❌ Email worker error:", error.message);
    throw error; // Bull will mark job as failed
  }
});
