const nodemailer = require("nodemailer");
require("dotenv").config()

const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOrderUpdateEmail = async (to, subject, { message, productImage}) => {
  try {
    const html = `
    <div style="font-family: Arial, sans-serif; background: #f5f7fa; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        
        <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #eee;">
          <h2 style="color: #333; margin: 0;">SmartTry</h2>
          <p style="color: #777; margin: 5px 0 0;">Order Update Notification</p>
        </div>

        <div style="padding: 20px 10px;">
          <h3 style="color: #222;">Hello 👋,</h3>
          <p style="font-size: 16px; color: #444;">
            ${message}
          </p>
        </div>

        <div style="padding: 20px; background: #f0f4ff; border-left: 4px solid #4a6cff; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0; color: #333; font-size: 15px;">
            We’ll keep you updated on every change in your order journey.
          </p>
        </div>

        <div style="text-align: center; padding-top: 10px;">
          <!-- PRODUCT IMAGE -->
        ${
          productImage
            ? `
              <div style="text-align: center; margin: 25px 0;">
                <img src="${productImage}" alt="Product Image" style="width: 180px; border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.15);" />
              </div>
            `
            : ""
        }
        </div>

        <p style="font-size: 13px; color: #777; text-align: center; margin-top: 25px;">
          Thank you for shopping with SmartTry 💙<br>
          This is an automated email – no reply needed.
        </p>
      </div>
    </div>
    `;

    await transporter.sendMail({
      from: `"SmartTry Orders" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: message, // fallback
      html,             // HTML body
    });

    console.log(`📧 HTML Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
  }
};

module.exports = {sendOrderUpdateEmail}