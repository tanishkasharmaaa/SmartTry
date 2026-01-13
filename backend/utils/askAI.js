// controllers/askAI.js
const productModel = require("../model/products");

const handleManual = require("./manualHandlers");
const askGeminiFlash = require("./askGeminiFlash");

require("dotenv").config();

function send(ws, res, resultType, data) {
  if (ws?.readyState === 1) {
    ws.send(
      JSON.stringify({
        type: "aiMessage",
        resultType,
        data,
      })
    );
    ws.send(JSON.stringify({ type: "aiEnd" }));
    return;
  }

  return res.json({
    success: true,
    type: resultType,
    data,
  });
}


const askAI = async (req, res, ws = null, history = []) => {
   try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: "Query required" });
    }

    /* ================= FETCH DATA ================= */
    const categories = await productModel.distinct("category");
    const products = await productModel.find({}).limit(30).lean();

    /* ======================================================
       1️⃣ AI FIRST
    ====================================================== */
    const aiResult = await askGeminiFlash(
      query,
      products,
      categories,
      history
    );

    /* ======================================================
   🔥 NEW: HANDLE GEMINI RESULT OBJECT
====================================================== */
if (aiResult?.resultType === "products" && aiResult.data?.length) {
  const payload = {
    type: "aiMessage",
    resultType: "products",
    data: aiResult.data,
  };

  if (ws?.readyState === 1) {
    ws.send(JSON.stringify(payload));
    ws.send(JSON.stringify({ type: "aiEnd" }));
    return;
  }

  return res.json({ success: true, ...payload });
}

    /* ======================================================
       2️⃣ MANUAL FALLBACK
    ====================================================== */
    const manualResult = await handleManual({ query, req });

    if (manualResult) {
      const payload = {
        type: "aiMessage",
        resultType: manualResult.resultType,
        data: manualResult.data,
      };

      if (ws?.readyState === 1) {
        ws.send(JSON.stringify(payload));
        ws.send(JSON.stringify({ type: "aiEnd" }));
        return;
      }

      return res.json({ success: true, ...payload });
    }

    /* ======================================================
       3️⃣ FINAL MESSAGE
    ====================================================== */
    const fallback = {
      type: "aiMessage",
      resultType: "message",
      data: [
        {
          type: "message",
          text:
            "🤔 I couldn’t find a perfect match yet. Try:\n• Best shoes for men\n• Girls outfits under 3000\n• Trending fashion",
        },
      ],
    };

    if (ws?.readyState === 1) {
      ws.send(JSON.stringify(fallback));
      ws.send(JSON.stringify({ type: "aiEnd" }));
      return;
    }

    return res.json({ success: true, ...fallback });

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
