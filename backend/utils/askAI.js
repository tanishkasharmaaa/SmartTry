const productModel = require("../model/products");
const handleManual = require("./manualHandlers");
const askGeminiFlash = require("./askGeminiFlash");
require("dotenv").config();

function send(ws, res, resultType, data) {
  if (ws?.readyState === 1) {
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

    /* ================= FETCH DATA ================= */
    const categories = await productModel.distinct("category");
    const products = await productModel.find({}).limit(30).lean();

    /* ================= UPDATE CONTEXT ================= */
    if (/for men|men/i.test(query)) context.gender = "Men";
    else if (/for women|women/i.test(query)) context.gender = "Women";
    else if (/for both/i.test(query)) context.gender = "Unisex";

    if (/casual/i.test(query)) context.category = "Casual";
    else if (/party/i.test(query)) context.category = "Party";
    else if (/office/i.test(query)) context.category = "Office";

    context.history = context.history || [];

    /* ================= AI FIRST ================= */
    let aiResult = await askGeminiFlash(query, products, categories, context);

    // ✅ If AI returns null or empty products, fallback to manual
    if (
      !aiResult ||
      (aiResult.resultType === "products" && Array.isArray(aiResult.data) && aiResult.data.length === 0)
    ) {
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
    context.history.push({ user: query, ai: fallback.map((d) => d.text).join("\n") });
  } catch (err) {
    console.error("ASK AI ERROR:", err);
    if (ws?.readyState === 1) {
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
