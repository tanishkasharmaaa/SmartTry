// config/emailQueue.js
const { Redis } = require("@upstash/redis");
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
      // call sendSignupEmail / sendOrderUpdateEmail here
    } else {
      await new Promise((r) => setTimeout(r, 1000)); // wait 1s if empty
    }
  }
}

module.exports = { addEmailJob, processEmailJobs };
