// queue/emailQueue.js
const Bull = require("bull");
const redis = require("../config/redis");

const emailQueue = new Bull("emailQueue", {
  redis: {
    host: redis.host,
    port: redis.port,
    password: redis.password,
  },
  defaultJobOptions: {
    attempts: 3,            // retry email 3 times
    backoff: {
      type: "exponential",  // exponential delay -> 1s → 2s → 4s
      delay: 1000,
    }
  }
});

module.exports = emailQueue;
