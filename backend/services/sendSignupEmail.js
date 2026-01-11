require("dotenv").config();
const sgMail = require("@sendgrid/mail");

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends signup email using SendGrid
 * @param {Object} param0
 * @param {string} param0.to - Recipient email
 * @param {string} param0.subject - Email subject
 * @param {string} param0.username - Username to personalize email
 */
const sendSignupEmail = async ({ to, subject, username }) => {
  try {
    if (!to || !subject || !username) {
      throw new Error("Missing required fields for sending email");
    }

    const html = `
      <div style="font-family: Arial, sans-serif; background: #000; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: #111; border-radius: 10px; padding: 25px; border: 1px solid #333;">
          <div style="text-align: center; padding-bottom: 15px; border-bottom: 1px solid #333;">
            <h2 style="color: #fff; margin: 0;">SM△RTTRY</h2>
            <p style="color: #aaa; margin: 5px 0 0;">Welcome to SmartTry 🎉</p>
          </div>
          <div style="padding: 20px 10px;">
            <h3 style="color: #fff;">Hello ${username} 👋,</h3>
            <p style="font-size: 16px; color: #ccc;">
              Your signup was successful! Enjoy shopping at SmartTry.
            </p>
          </div>
          <p style="font-size: 13px; color: #888; text-align: center; margin-top: 25px;">
            Thank you for joining SmartTry 🖤<br>This is an automated email – no reply needed.
          </p>
        </div>
      </div>
    `;

    const msg = {
      to,
      from: process.env.EMAIL_FROM, // must be a verified sender email
      subject,
      html,
      text: `Welcome ${username}, your signup is successful.`,
    };

    await sgMail.send(msg);

    console.log(`📧 Signup Email sent to ${to}`);
    return { success: true };

  } catch (error) {
    console.error("❌ Signup Email failed:", error.response?.body || error.message);
    return { success: false, error: error.message };
  }
};

const sendOrderUpdateEmail = async ({ to, orderId, status, items, totalAmount, message }) => {
  try {
    if (!to || !orderId || !status || !items) {
      throw new Error("Missing required fields for sending order update email");
    }

    // Build order items HTML
    const itemsHtml = items
      .map(
        (item) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">
          <img src="${item.image}" alt="${item.title}" width="60" style="display:block;"/>
        </td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.title}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.size}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align:center;">${item.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align:right;">₹${item.price}</td>
      </tr>
    `
      )
      .join("");

    const html = `
      <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; padding: 25px; border: 1px solid #ddd;">
          <div style="text-align: center; padding-bottom: 15px; border-bottom: 1px solid #eee;">
            <h2 style="color: #333; margin: 0;">SM△RTTRY</h2>
            <p style="color: #555; margin: 5px 0 0;">Order Update Notification</p>
          </div>

          <div style="padding: 20px 10px;">
            <h3 style="color: #333;">Hello 👋,</h3>
            <p style="font-size: 16px; color: #555;">
              Your order <strong>#${orderId}</strong> status has been updated to: 
              <strong>${status}</strong>.
            </p>

            ${message ? `<p style="font-size: 14px; color: #777;">${message}</p>` : ""}

            <table style="width:100%; border-collapse: collapse; margin-top: 15px;">
              <thead>
                <tr>
                  <th style="padding: 8px; border: 1px solid #ddd;">Image</th>
                  <th style="padding: 8px; border: 1px solid #ddd;">Product</th>
                  <th style="padding: 8px; border: 1px solid #ddd;">Size</th>
                  <th style="padding: 8px; border: 1px solid #ddd;">Qty</th>
                  <th style="padding: 8px; border: 1px solid #ddd;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="padding: 8px; border: 1px solid #ddd; text-align:right; font-weight:bold;">Total</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align:right; font-weight:bold;">₹${totalAmount}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p style="font-size: 13px; color: #888; text-align: center; margin-top: 25px;">
            Thank you for shopping with SmartTry 🖤<br>This is an automated email – no reply needed.
          </p>
        </div>
      </div>
    `;

    const msg = {
      to,
      from: process.env.EMAIL_FROM,
      subject: `Order #${orderId} Update: ${status}`,
      html,
      text: `Your order #${orderId} status is now: ${status}. Total: ₹${totalAmount}`,
    };

    await sgMail.send(msg);

    console.log(`📧 Order Update Email sent to ${to} for order ${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Order Update Email failed:", error.response?.body || error.message);
    return { success: false, error: error.message };
  }
};


module.exports = { sendSignupEmail, sendOrderUpdateEmail };
