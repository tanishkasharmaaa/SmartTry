const Queue = require("bull");
require("dotenv").config();

const emailQueue = new Queue("emailQueue", process.env.REDIS_URL); // pass URL string

emailQueue.on("error", (err) => console.error("❌ Queue Error:", err));
emailQueue.on("waiting", (jobId) => console.log(`🕓 Job waiting: ${jobId}`));
emailQueue.on("active", (job) => console.log(`⚡ Processing job: ${job.id}`));
emailQueue.on("completed", (job) => console.log(`✅ Job completed: ${job.id}`));
emailQueue.on("failed", (job, err) => console.log(`❌ Job failed: ${job.id}, Error:`, err));

module.exports = emailQueue;
