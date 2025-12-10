const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDb = require("./config/db");
const session = require("express-session");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const { v4: uuid4 } = require("uuid");
const WebSocket = require("ws");

dotenv.config();

require("./config/passportSetup");
require("./cron/orderTracker");
require("./queue/emailWorker")

const app = express();

// ---------------------------------- MIDDLEWARE ----------------------------------

// CORS (IMPORTANT: must allow credentials for cookies)
app.use(
  cors(
    {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  }
)
);

app.use(express.json());
app.use(cookieParser());

// Express-session (passport depends on it)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // HTTPS only in production
      httpOnly: true,
      sameSite: "none"
    }
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

// ---------------------------------- START SERVER ----------------------------------

const port = process.env.PORT || 5000;

const server = app.listen(port, async () => {
  try {
    await connectDb();
    console.log(`🚀 Server running on port: ${port}`);
  } catch (error) {
    console.log("❌ Database connection failed:", error);
    process.exit(1);
  }
});

// ---------------------------------- WEBSOCKET SERVER ----------------------------------

const wss = new WebSocket.Server({ server });

const sessions = new Map();

wss.on("connection", (ws) => {

  const sessionId = uuid4();
  sessions.set(sessionId, ws);

  console.log(`✨ New WebSocket connection: ${sessionId}`);

  ws.send(JSON.stringify({ type: "connected", sessionId }));

  // Handle incoming WebSocket messages
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "askAI") {
        const askAI = require("./utils/askAI");

        const req = { body: data };

        const res = {
          status: (code) => ({
            json: (obj) => ws.send(JSON.stringify(obj)),
          }),
        };

        await askAI(req, res, ws);
      }

    } catch (err) {
      console.error("❌ WS message error:", err);

      ws.send(JSON.stringify({
        success: false,
        message: "Invalid message format"
      }));
    }
  });

  ws.on("close", () => {
    console.log(`❌ WS connection closed: ${sessionId}`);
    sessions.delete(sessionId);
  });

  ws.on("error", (err) => {
    console.error("⚠ WebSocket Error:", err);
  });
});
