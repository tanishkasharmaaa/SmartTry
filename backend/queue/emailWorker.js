const Queue = require("bull");
require("dotenv").config();

const { sendSignupEmail,sendOrderUpdateEmail } = require("../services/sendSignupEmail");

const emailQueue = new Queue("emailQueue", process.env.REDIS_URL);

emailQueue.process(async (job, done) => {
  try {
    const data = job.data;

    if (data.type === "signup") {
      await sendSignupEmail({
        to: data.to,
        subject: data.subject,
        username: data.username,
      });
    }

    if (data.type === "orderUpdate") {
      await sendOrderUpdateEmail({
        to: data.to,
        subject: data.subject,
        message: data.message,
        productImage: data.productImage,
      });
    }

    done();
  } catch (err) {
    console.error("❌ Email job failed:", err);
    done(err);
  }
});

module.exports = emailQueue;
