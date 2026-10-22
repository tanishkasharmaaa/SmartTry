// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const { v4: uuid4 } = require("uuid");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const productRouter = require("./routes/products.route");
const paymentRouter = require("./routes/payment.route");

const connectDb = require("./config/db");
require("./config/passportSetup");
require("./cron/orderTracker");
require("./queue/emailWorker");

const app = express();

// ---------------------------------- MIDDLEWARE ----------------------------------

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL||"http://localhost:5173",
    credentials: true,
  })
);

// JSON + Cookie parser
app.use(express.json());
app.use(cookieParser());

// Express-session (passport depends on it)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // only secure in prod
      httpOnly: true,
      sameSite: "none",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ---------------------------------- ROUTES ----------------------------------

app.get("/", (req, res) => {
  res.send(`
    <h1>SmartTry API is running...</h1>
    <a href="/auth/google">Login with Google</a>
  `);
});


app.use("/auth", require("./routes/auth.route"));
app.use("/api/users", require("./routes/users.route"));
app.use("/api/login", require("./routes/login.route"));
app.use("/api/products",productRouter);
app.use("/api/stock", require("./routes/stock.route"));
app.use("/api/reviews", require("./routes/reviews.route"));
app.use("/api/cart", require("./routes/cart.route"));
app.use("/api/order", require("./routes/order.route"));
app.use("/api/rules", require("./routes/rules.route"));
app.use("/api/askAI", require("./routes/askAI.route"));
app.use("/api/recommendations", require("./routes/recommendations.route"));
app.use("/api/payment", paymentRouter);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});
// ---------------------------------- START SERVER ----------------------------------

const PORT = process.env.PORT ;

const server = app.listen(PORT, async () => {
  try {
    await connectDb();
    console.log(`🚀 Server running on port: ${PORT}`);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
});

// ---------------------------------- WEBSOCKET SERVER ----------------------------------

const url = require("url");
const wss = new WebSocket.Server({ server });
const sessions = new Map(); // sessionId -> { ws, userId }

wss.on("connection", (ws, req) => {
  let token;

  // 1️⃣ Try to get token from URL query (for local/dev)
  try {
    const url = new URL(req.url, `http://${req.headers.host}`); // parse query
    token = url.searchParams.get("token");
    console.log(token)
  } catch {}

  // 2️⃣ If not in URL, try to get token from cookies (production)
  if (!token) {
    const rawCookies = req.headers.cookie || "";
    const cookies = Object.fromEntries(
      rawCookies.split("; ").map(c => {
        const [key, ...v] = c.split("=");
        return [key, v.join("=")];
      })
    );
    token = cookies.token;
  }

  // 3️⃣ If still no token → close connection
  if (!token) {
    console.log("❌ No token found, closing connection");
    ws.close();
    return;
  }

  // 4️⃣ Verify JWT
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log(decoded)
    userId = decoded.userId;
    ws.userId = userId;
    console.log(`✅ WS connected: User ID = ${userId}`);
  } catch (err) {
    console.log("❌ Invalid token, closing connection");
    ws.close();
    return;
  }

  // 5️⃣ Generate sessionId and store
  const sessionId = uuid4();
  sessions.set(sessionId, { ws, userId });

  // 6️⃣ Inform client
  ws.send(JSON.stringify({ type: "connected", sessionId, userId }));

  // 7️⃣ Handle messages
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "askAI") {
        const askAI = require("./utils/askAI");

        // Mock req/res objects for askAI
        const req = { body: data, userId };
        const res = {
          status: (code) => ({
            json: (obj) => {
              ws.send(JSON.stringify({ ...obj, status: code, sessionId, userId }));
            },
          }),
        };

        await askAI(req, res, ws);
      }
    } catch (err) {
      console.error("❌ WebSocket message error:", err);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "aiMessage",
            resultType: "general",
            data: [
              {
                type: "message",
                text:
                  "Oops! Something went wrong 😅.\n\nTry asking:\n• Products under 5000\n• Best items for men\n• Top rated products\n• Categories available\n\nI’m here to help 😊",
              },
            ],
            fallback: true,
            sessionId,
            userId,
          })
        );
        ws.send(JSON.stringify({ type: "aiEnd", sessionId, userId }));
      }
    }
  });

  // 8️⃣ Handle close & errors
  ws.on("close", () => {
    console.log(`❌ WS connection closed: sessionId=${sessionId}, userId=${userId}`);
    sessions.delete(sessionId);
  });

  ws.on("error", (err) => console.error("⚠ WebSocket Error:", err));

  // 9️⃣ Optional heartbeat/ping
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "ping", sessionId, userId }));
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);
});
