const Queue = require("bull");
const redis = require("../config/redis");

const emailQueue = new Queue("emailQueue", {
  redis: {
    host: redis.options.host,
    port: redis.options.port,
    password: redis.options.password
  }
});

module.exports = emailQueue;
