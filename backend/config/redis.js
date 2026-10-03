// config/redis.js
require("dotenv").config();
const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false, 
  retryStrategy(times) {
    const delay = Math.min(times * 2000, 30000);
    // Fixed template literal string below using backticks
    console.warn(`⚠️ Redis disconnected. Retrying in \${delay / 1000}s... (Attempt\${times})`);
    return delay;
  },
});

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error (ignoring to keep app alive):", err.message);
});

module.exports = redis;