// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const { v4: uuid4 } = require("uuid");
const WebSocket = require("ws");

const connectDb = require("./config/db");
require("./config/passportSetup");
require("./cron/orderTracker");
require("./queue/emailWorker");

const app = express();

// ---------------------------------- MIDDLEWARE ----------------------------------

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
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
app.use("/api/products", require("./routes/products.route"));
app.use("/api/stock", require("./routes/stock.route"));
app.use("/api/reviews", require("./routes/reviews.route"));
app.use("/api/cart", require("./routes/cart.route"));
app.use("/api/order", require("./routes/order.route"));
app.use("/api/rules", require("./routes/rules.route"));
app.use("/api/askAI", require("./routes/askAI.route"));
app.use("/api/recommendations", require("./routes/recommendations.route"));

// ---------------------------------- START SERVER ----------------------------------

const PORT = process.env.PORT || 5000;

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

// ---------------------------------- WEBSOCKET SERVER ----------------------------------
// ---------------------------------- WEBSOCKET SERVER ----------------------------------
const wss = new WebSocket.Server({ server });
const sessions = new Map(); // sessionId -> ws

wss.on("connection", (ws) => {
  // Generate a unique session ID for this connection
  const sessionId = uuid4();
  sessions.set(sessionId, ws);

  console.log(`✨ New WebSocket connection: ${sessionId}`);

  // Inform client that connection is established
  ws.send(JSON.stringify({ type: "connected", sessionId }));

  // Keep connection state
  let connected = true;

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      // Handle AI ask requests
      if (data.type === "askAI") {
        const askAI = require("./utils/askAI");

        // Mock req/res objects for WebSocket calls
        const req = { body: data };
        const res = {
          status: (code) => ({
            json: (obj) => {
              ws.send(JSON.stringify({ ...obj, status: code, sessionId }));
            },
          }),
        };

        // Call askAI, passing ws so streaming / product carousel works
        await askAI(req, res, ws);

        return;
      }

      // Add other message types here if needed
      // Example: typing indicators, read receipts, etc.

    } catch (err) {
      console.error("❌ WebSocket message error:", err);

      // Send AI fallback message if anything fails
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "aiMessage",
            resultType: "general",
            data: [
              {
                type: "message",
                text:
                  "Oops! Something went wrong 😅.\n\n" +
                  "Try asking:\n" +
                  "• Products under 5000\n" +
                  "• Best items for men\n" +
                  "• Top rated products\n" +
                  "• Categories available\n\n" +
                  "I’m here to help 😊",
              },
            ],
            fallback: true,
            sessionId,
          })
        );
        ws.send(JSON.stringify({ type: "aiEnd", sessionId }));
      }
    }
  });

  // Connection closed
  ws.on("close", () => {
    console.log(`❌ WS connection closed: ${sessionId}`);
    sessions.delete(sessionId);
    connected = false;
  });

  ws.on("error", (err) => {
    console.error("⚠ WebSocket Error:", err);
    connected = false;
  });

  // Optional: heartbeat/ping to check if client is alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "ping", sessionId }));
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);
});
