// config/redis.js
require("dotenv").config();
const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,  // avoid MaxRetriesPerRequestError
  enableOfflineQueue: true,    // queue jobs if Redis temporarily down
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err));

module.exports = redis;
