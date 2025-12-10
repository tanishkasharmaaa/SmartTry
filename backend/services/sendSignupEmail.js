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
    <div style="font-family: Arial, sans-serif; background: #000; padding: 30px;">
  <div style="
      max-width: 600px; 
      margin: auto; 
      background: #111; 
      border-radius: 10px; 
      padding: 25px; 
      box-shadow: 0 4px 15px rgba(255,255,255,0.05);
      border: 1px solid #333;
  ">
    
    <div style="text-align: center; padding-bottom: 15px; border-bottom: 1px solid #333;">
      <h2 style="color: #fff; margin: 0; letter-spacing: 1.5px;">SM△RTTRY</h2>
      <p style="color: #aaa; margin: 5px 0 0;">Welcome to SmartTry 🎉</p>
    </div>

    <div style="padding: 20px 10px;">
      <h3 style="color: #fff;">Hello ${username} 👋,</h3>
      <p style="font-size: 16px; color: #ccc;">
        Your signup was successful! You can now explore SmartTry and enjoy a smooth shopping experience with us.
      </p>
    </div>

    <div style="
        padding: 20px; 
        background: #1a1a1a; 
        border-left: 4px solid #fff; 
        margin: 20px 0; 
        border-radius: 6px;
    ">
      <p style="margin: 0; color: #eee; font-size: 15px;">
        If this wasn’t you, please ignore this email or secure your account.
      </p>
    </div>

    <p style="font-size: 13px; color: #888; text-align: center; margin-top: 25px;">
      Thank you for joining SmartTry 🖤<br>
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
