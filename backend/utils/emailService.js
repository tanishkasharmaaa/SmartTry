require("dotenv").config();
const nodemailer = require("nodemailer");

/**
 * Sends order update email using Gmail SMTP (App Password)
 * @param {Object} param0
 * @param {string} param0.to - Recipient email
 * @param {string} param0.subject - Email subject
 * @param {string} param0.message - Email message body
 * @param {string} [param0.productImage] - Optional product image URL
 */
const sendOrderUpdateEmail = async ({ to, subject, message, productImage }) => {
  if (!to || !subject || !message) {
    throw new Error("Missing required email fields");
  }

  try {
    // Create Nodemailer transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your Gmail address
        pass: process.env.EMAIL_PASS, // your Gmail App Password
      },
    });

    const html = `
      <div style="font-family: Arial, sans-serif; background: #000; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: #111; padding: 25px; border-radius: 10px; border: 1px solid #333;">
          <h2 style="text-align: center; color: #fff; margin-bottom: 10px; letter-spacing: 2px;">
            SM△RTTRY
          </h2>

          <p style="font-size: 15px; color: #ddd; line-height: 1.6;">
            ${message}
          </p>

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

          <p style="text-align:center; font-size: 12px; color: #aaa; margin-top: 25px;">
            Thank you for using SmartTry 🖤<br>
            — This is an automated email —
          </p>
        </div>
      </div>
    `;

    // Send email
    await transporter.sendMail({
      from: `"SmartTry" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: message,
      html,
    });

    console.log(`📧 Order update email sent to ${to}`);

  } catch (err) {
    console.error("❌ Order update email failed:", err.message);
    throw err;
  }
};

module.exports = { sendOrderUpdateEmail };
