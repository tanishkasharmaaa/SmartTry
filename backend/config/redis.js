const Redis = require("ioredis");
require("dotenv").config();

// Use your RedisLabs URL from .env
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // prevents max retries error
  enableOfflineQueue: true,   // queue commands if disconnected
});

redis.on("connect", () => console.log("✅ Connected to Redis"));
redis.on("error", (err) => console.error("❌ Redis Connection Error:", err));

module.exports = redis;
