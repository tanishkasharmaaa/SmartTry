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
    console.error(
      "❌ Signup Email failed:",
      error.response?.body || error.message
    );
    return { success: false, error: error.message };
  }
};

const sendOrderUpdateEmail = async ({
  to,
  orderId,
  status,
  items,
  totalAmount,
  message,
}) => {
  console.log(items, "------------ send order update email");
  try {
    if (
      !to ||
      !orderId ||
      !status ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      throw new Error("Missing or invalid order email fields");
    }

    const html = `
<div style="background:#0b0b0b;padding:40px 10px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:640px;margin:auto;background:#111;border-radius:16px;overflow:hidden;border:1px solid #222;">

    <!-- HEADER -->
    <div style="padding:28px;text-align:center;border-bottom:1px solid #222;">
      <h1 style="margin:0;color:#fff;letter-spacing:2px;">SM△RTTRY</h1>
      <p style="margin:6px 0 0;color:#aaa;font-size:14px;">
        Order Confirmation
      </p>
    </div>

    <!-- STATUS -->
    <div style="padding:26px;">
      <h2 style="margin:0 0 10px;color:#fff;font-size:20px;">
        Your order is <span style="color:#4CAF50;">${status}</span>
      </h2>

      <p style="color:#bbb;font-size:15px;line-height:1.6;">
        Order ID:
        <strong style="color:#fff;">#${orderId}</strong><br/>
        ${
          message ||
          "Thank you for shopping with SmartTry. We’re preparing your order."
        }
      </p>
    </div>

    <!-- PRODUCTS -->
    <div style="padding:0 26px 10px;">
      ${items
        .map(
          (item) => `
        <div style="display:flex;gap:16px;padding:16px;background:#181818;border-radius:14px;margin-bottom:14px;">
          <img 
            src="${item.image || "https://via.placeholder.com/120"}"
            width="90"
            height="110"
            style="border-radius:12px;object-fit:cover;border:1px solid #333;"
          />

          <div style="flex:1;">
            <h4 style="margin:0 0 6px;color:#fff;font-size:16px;">
              ${item.name}
            </h4>

            <p style="margin:0;color:#999;font-size:13px;">
              Size: <strong style="color:#ddd;">${
                item.size || "Free Size"
              }</strong><br/>
              Qty: <strong style="color:#ddd;">${item.quantity}</strong>
            </p>

            <p style="margin:8px 0 0;color:#fff;font-size:15px;">
              ₹${item.price}
            </p>
          </div>
        </div>
      `
        )
        .join("")}
    </div>

    <!-- TOTAL -->
    <div style="padding:22px 26px;border-top:1px solid #222;">
      <div style="display:flex;justify-content:space-between;color:#ccc;font-size:15px;">
        <span>Total Amount</span>
        <strong style="color:#fff;font-size:18px;">
          ₹ ${totalAmount}
        </strong>
      </div>
    </div>

    <!-- CTA -->
    <div style="padding:28px;text-align:center;">
      <a
        href="${process.env.FRONTEND_URL}/orders/${orderId}"
        style="display:inline-block;padding:14px 26px;background:#fff;color:#000;text-decoration:none;border-radius:30px;font-weight:bold;font-size:14px;"
      >
        View Order
      </a>
    </div>

    <!-- FOOTER -->
    <div style="padding:18px;text-align:center;border-top:1px solid #222;">
      <p style="margin:0;color:#777;font-size:12px;">
        Thank you for shopping with SmartTry 🖤<br/>
        This is an automated email. Please do not reply.
      </p>
    </div>

  </div>
</div>
`;

    const msg = {
      to,
      from: process.env.EMAIL_FROM,
      subject: `Order #${orderId} Update: ${status}`,
      html,
      text: `Order #${orderId} is now ${status}. Total ₹${totalAmount}`,
    };

    const [response] = await sgMail.send(msg);
    console.log("📧 SendGrid status:", response.statusCode);

    return { success: true };
  } catch (error) {
    console.error(
      "❌ Order Update Email failed:",
      error.response?.body || error.message
    );
    return { success: false, error: error.message };
  }
};

module.exports = { sendSignupEmail, sendOrderUpdateEmail };
