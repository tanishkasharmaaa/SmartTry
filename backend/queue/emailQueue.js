// queue/emailQueue.js
const Queue = require("bull");
require("dotenv").config();

const emailQueue = new Queue("emailQueue", process.env.REDIS_URL);

module.exports = emailQueue;
