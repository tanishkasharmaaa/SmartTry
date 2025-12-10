const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendSignupEmail = async (to, subject, { username }) => {
  console.log("hello.....")
  try {
    const html = `
    <div style="font-family: Arial, sans-serif; background: #f5f7fa; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        
        <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #eee;">
          <h2 style="color: #333; margin: 0;">SmartTry</h2>
          <p style="color: #777; margin: 5px 0 0;">Welcome to SmartTry 🎉</p>
        </div>

        <div style="padding: 20px 10px;">
          <h3 style="color: #222;">Hello ${username} 👋,</h3>
          <p style="font-size: 16px; color: #444;">
            Your signup was successful! You can now explore SmartTry and enjoy a smooth shopping experience with us.
          </p>
        </div>

        <div style="padding: 20px; background: #e8fff1; border-left: 4px solid #28c76f; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0; color: #333; font-size: 15px;">
            If this wasn’t you, please ignore this email or secure your account.
          </p>
        </div>

        <p style="font-size: 13px; color: #777; text-align: center; margin-top: 25px;">
          Thank you for joining SmartTry 💙<br>
          This is an automated email – no reply needed.
        </p>
      </div>
    </div>
    `;

    await transporter.sendMail({
      from: `"SmartTry Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: `Welcome ${username}, your signup is successful.`,
      html,
    });

    console.log(`📧 Signup Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Signup Email failed:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSignupEmail };
