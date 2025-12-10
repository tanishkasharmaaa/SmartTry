require("dotenv").config();

const redisOptions = {
  url: process.env.REDIS_URL,
  connectTimeout: 10000,      // 10 seconds
  maxRetriesPerRequest: null,  // prevents max retries error
  enableOfflineQueue: true,
};

module.exports = redisOptions;
