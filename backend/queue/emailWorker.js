// queue/emailWorker.js
const emailQueue = require("./emailQueue");
const {sendOrderUpdateEmail} = require("../utils/emailService");

emailQueue.process(async (job, done) => {
  try {
    console.log("Processing email job:", job.data);

    const { to, subject, message, productImage } = job.data;

    if (!to || !subject || !message) {
      console.log("❌ Email sending failed: Missing required email fields");
      return done();
    }

    await sendOrderUpdateEmail({ to, subject, message, productImage });

    console.log(`✅ Email sent to ${to}`);
    done();

  } catch (error) {
    console.error("❌ Worker error:", error.message);
    done(error);
  }
});
