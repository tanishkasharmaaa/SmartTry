const Queue = require("bull");
require("dotenv").config();

const { sendSignupEmail } = require("../services/sendSignupEmail");
const { sendOrderUpdateEmail } = require("../utils/emailService");

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
      await sendOrderUpdateEmail(data);
    }

    done();
  } catch (err) {
    console.error("❌ Email job failed:", err);
    done(err);
  }
});
