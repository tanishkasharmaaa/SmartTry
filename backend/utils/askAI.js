const productModel = require("../model/products");
const handleManual = require("./manualHandlers");
const askGeminiFlash = require("./askGeminiFlash");
const WebSocket = require("ws");

require("dotenv").config();

function send(ws, res, resultType, data) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "aiMessage", resultType, data }));
    ws.send(JSON.stringify({ type: "aiEnd" }));
    return;
  }

  return res.json({ success: true, type: resultType, data });
}

const askAI = async (req, res, ws = null, context = {}) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: "Query required" });

    /* ================= CONTEXT PERSISTENCE ================= */
    if (ws) {
      ws.context = ws.context || {};
      context = ws.context;
    }

    /* ================= UPDATE CONTEXT HISTORY ================= */
    if (/for men|men/i.test(query)) context.gender = "Men";
    else if (/for women|women/i.test(query)) context.gender = "Women";
    else if (/for both/i.test(query)) context.gender = "Unisex";

    if (/casual/i.test(query)) context.category = "Casual";
    else if (/party/i.test(query)) context.category = "Party";
    else if (/office/i.test(query)) context.category = "Office";

    context.history = context.history || [];

    /* ================= AI FIRST ================= */
    // ✅ FIX: Pass query directly to askGeminiFlash to match function signature
    let aiResult = await askGeminiFlash(query);

    // ✅ If AI fails or returns empty response → fallback to manual handler
    if (!aiResult) {
      aiResult = await handleManual({ query, req });
    }

    if (aiResult) {
      send(ws, res, aiResult.resultType, aiResult.data);

      context.history.push({
        user: query,
        ai:
          aiResult.resultType === "message"
            ? aiResult.data.map((d) => d.text).join("\n")
            : aiResult.data.map((p) => p.name).join(", "),
      });

      // Prevent memory leaks / infinite context growth
      if (context.history.length > 10) {
        context.history.shift();
      }

      return;
    }

    /* ================= FINAL FALLBACK ================= */
    const fallback = [
      {
        type: "message",
        text:
          "🤔 I couldn’t find a perfect match yet. Try:\n• Best outfit for men\n• Girls outfits under 3000\n• Trending fashion",
      },
    ];

    send(ws, res, "message", fallback);

    context.history.push({
      user: query,
      ai: fallback.map((d) => d.text).join("\n"),
    });

    if (context.history.length > 10) {
      context.history.shift();
    }

  } catch (err) {
    console.error("ASK AI ERROR:", err);

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "aiError",
          message: "AI is temporarily busy. Please try again.",
        })
      );
      return;
    }

    return res.status(500).json({
      success: false,
      message: "AI temporarily unavailable",
    });
  }
};

module.exports = askAI;