// config/redis.js
require("dotenv").config();
const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
  tls: {}, // Required for rediss://
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err));



// Example usage
async function test() {
  try {
    await redis.set("ping", "pong");
    const value = await redis.get("ping");
    console.log("✅ Redis value:", value);
  } catch (err) {
    console.error("❌ Redis error:", err);
  }
}

test();

module.exports = redis;
