const Queue = require("bull");
const redisOptions = require("../config/redis");

const emailQueue = new Queue("emailQueue", {
  redis: redisOptions,
});

emailQueue.on("error", (err) => console.error("❌ Queue Error:", err));
emailQueue.on("waiting", (jobId) => console.log(`🕓 Job waiting: ${jobId}`));
emailQueue.on("active", (job) => console.log(`⚡ Processing job: ${job.id}`));

module.exports = emailQueue;
