const { Redis } = require("@upstash/redis");
const { sendSignupEmail,sendOrderUpdateEmail } = require("../services/sendSignupEmail");
require("dotenv").config();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Add job to queue
async function addEmailJob(jobData) {
  await redis.lpush("emailQueue", JSON.stringify(jobData));
  console.log("🕓 Job added to Upstash queue");
}

// Process jobs
async function processEmailJobs() {
  while (true) {
    const job = await redis.rpop("emailQueue");
    if (job) {
      const data = JSON.parse(job);
      console.log("⚡ Processing job:", data);

      try {
        // Differentiate job types
        if (data.type === "signup") {
          await sendSignupEmail({
            to: data.to,
            subject: data.subject,
            username: data.username,
          });
        } else if (data.type === "orderUpdate") {
          await sendOrderUpdateEmail({
            to: data.to,
            orderId: data.orderId,
            status: data.status,
            items: data.items,
            totalAmount: data.totalAmount,
            message: data.message,
          });
        } else {
          console.log("⚠️ Unknown job type:", data.type);
        }
      } catch (error) {
        console.error("❌ Failed processing job:", error.message);
        // Optionally: re-add to queue or log for retry
      }
    } else {
      await new Promise((r) => setTimeout(r, 1000)); // wait 1s if queue empty
    }
  }
}

module.exports = { addEmailJob, processEmailJobs };
