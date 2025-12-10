// sendOrderUpdateEmail.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Correct signature → worker will pass ONE job.data object
 * job.data = { to, subject, message, productImage }
 */
const sendOrderUpdateEmail = async ({ to, subject, message, productImage }) => {
  if (!to || !subject || !message) {
    throw new Error("Missing required email fields");
  }

  const html = `
   <div style="font-family: Arial, sans-serif; background: #000; padding: 30px;">
  <div style="
      max-width: 600px; 
      margin: auto; 
      background: #111; 
      padding: 25px; 
      border-radius: 10px;
      border: 1px solid #333;
  ">
    
    <!-- LOGO -->
    <h2 style="
        text-align: center; 
        color: #fff; 
        margin-bottom: 10px;
        letter-spacing: 2px;
    ">
      SM△RTTRY
    </h2>

    <!-- MESSAGE -->
    <p style="font-size: 15px; color: #ddd; line-height: 1.6;">
      ${message}
    </p>

    <!-- OPTIONAL PRODUCT IMAGE -->
    ${productImage ? `
      <img 
        src="${productImage}" 
        style="
          width: 180px; 
          border-radius: 10px; 
          display: block; 
          margin: 20px auto;
          border: 1px solid #444;
        "
      />` : ""
    }

    <!-- FOOTER -->
    <p style="text-align:center; font-size: 12px; color: #aaa; margin-top: 25px;">
      Thank you for using SmartTry 🖤<br>
      — This is an automated email —
    </p>

  </div>
</div>

  `;

  await transporter.sendMail({
    from: `SmartTry <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: message,
    html,
  });

  console.log(`📧 Email sent to ${to}`);
};

module.exports = { sendOrderUpdateEmail };
