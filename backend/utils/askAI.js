const productModel = require("../model/products");
const rulesModel = require("../model/rules");
require("dotenv").config();

// =======================================================
// GOOGLE GEMINI (NON-STREAMING) — FIXED & CLEAN
// =======================================================
async function generateGeminiReply(fullPrompt) {
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: fullPrompt }],
            },
          ],
        }),
      }
    );

    const data = await resp.json();
    console.log("📨 Gemini Raw Response:", JSON.stringify(data, null, 2));

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a reply."
    );
  } catch (err) {
    console.error("Gemini API Error:", err);
    return "Gemini API failed while generating a reply.";
  }
}

// =======================================================
// MAIN ASK AI CONTROLLER
// =======================================================
const askAI = async (req, res,ws = null) => {
  try {
    const { query, conversationHistory = [] } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const q = query.toLowerCase();
    let resultData = [];
    let resultType = "general";

    const categories = await productModel.distinct("category");

    // CATEGORY LIST
    if (q.includes("category") || q.includes("categories")) {
      resultType = "categories";
      resultData = categories;
    }
    // ====================================================
    // GENDER BASED FILTERING (Men / Women / Unisex)
    // ====================================================
    if (
      q.includes("men") ||
      q.includes("men's") ||
      q.includes("mens") ||
      q.includes("guy") ||
      q.includes("boys")
    ) {
      resultType = "products";
      resultData = await productModel.find({ gender: "Men" });
    } else if (
      q.includes("women") ||
      q.includes("women's") ||
      q.includes("womens") ||
      q.includes("girls") ||
      q.includes("ladies")
    ) {
      resultType = "products";
      resultData = await productModel.find({ gender: "Women" });
    } else if (
      q.includes("unisex") ||
      q.includes("all gender") ||
      q.includes("both")
    ) {
      resultType = "products";
      resultData = await productModel.find({ gender: "Unisex" });
    }

    // CATEGORY LIST
    else if (q.includes("category") || q.includes("categories")) {
      resultType = "categories";
      resultData = categories;
    }

    // CHEAPEST PRODUCTS
    else if (q.includes("cheapest") || q.includes("low price")) {
      resultType = "products";
      resultData = await productModel.find().sort({ price: 1 }).limit(10);
    }

    // MOST EXPENSIVE
    else if (q.includes("expensive") || q.includes("high price")) {
      resultType = "products";
      resultData = await productModel.find().sort({ price: -1 }).limit(10);
    }

    // PRICE RANGE BETWEEN X AND Y
    else if (q.includes("between") && q.includes("and")) {
      const match = q.match(/between\s+(\d+)\s+and\s+(\d+)/);
      if (match) {
        const min = Number(match[1]);
        const max = Number(match[2]);
        resultType = "products";
        resultData = await productModel.find({
          price: { $gte: min, $lte: max },
        });
      }
    }

    // PRODUCT NAME SEARCH
    // PRODUCT NAME SEARCH (big improvement)
    else if (
      q.includes("show") ||
      q.includes("find") ||
      q.includes("search") ||
      q.includes("looking for") ||
      q.includes("want")
    ) {
      // clean query
      const cleaned = q
        .replace(/show|find|search|looking for|want/gi, "")
        .replace(/-/g, " ") // fix hyphens ("t-shirt" → "t shirt")
        .trim();

      const words = cleaned.split(/\s+/).filter(Boolean);

      // create regex OR query for each word
      const regexArray = words.map((w) => new RegExp(w, "i"));

      resultType = "products";

      resultData = await productModel.find({
        $or: [
          { name: { $in: regexArray } },
          { description: { $in: regexArray } },
          { category: { $in: regexArray } },
        ],
      });
    }

    // TOP PRODUCTS
    else if (
      q.includes("best") ||
      q.includes("top") ||
      q.includes("quality") ||
      q.includes("recommend")
    ) {
      resultType = "products";
      resultData = await productModel
        .find()
        .sort({ rating: -1, soldCount: -1 })
        .limit(10);
    }

    // DISCOUNTS
    else if (q.includes("offer") || q.includes("discount")) {
      resultType = "products";
      resultData = await productModel.find({ discount: { $gte: 10 } });
    }

    // REFUND RULES
    else if (
      q.includes("refund") ||
      q.includes("return") ||
      q.includes("policy")
    ) {
      resultType = "rules";
      resultData = await rulesModel.find({ type: "refund" });
    }

    // ALL RULES
    else if (q.includes("rules") || q.includes("regulation")) {
      resultType = "rules";
      resultData = await rulesModel.find();
    }

    // DYNAMIC CATEGORY SEARCH
    else {
      const match = categories.find((c) => q.includes(c.toLowerCase()));
      if (match) {
        resultType = "products";
        resultData = await productModel.find({ category: match });
      }
    }

    // CLEAN PRODUCT DATA
    if (resultType === "products") {
      resultData = resultData.map((p) => ({
        name: p.name,
        price: p.price,
        description: p.description,
        category: p.category,
        gender: p.gender, // 👈 added
        image: p.image,
        rating: p.rating,
        discount: p.discount,
      }));
    }

    // ---------------------------------------------------
    // BUILD PROMPT
    // ---------------------------------------------------
    let prompt = `
You are SmartTry AI Assistant.
Rules:
- Respond short, friendly, human-like.
- For products: include name, price, rating, highlights.
- For categories: show clean bullet list.
- For rules: explain very simply.
- If no results: politely say "no items found".


Conversation History:
${conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}

User Query: ${query}

Detected Type: ${resultType}

Data:
${resultData.length ? JSON.stringify(resultData, null, 2) : "No results found"}
`;

    // ---------------------------------------------------
    // CALL GEMINI
    // ---------------------------------------------------
    const reply = await generateGeminiReply(prompt);

   if (ws) {
  // Send AI reply over WebSocket (single message)
  ws.send(JSON.stringify({
    type: "aiMessage", // Use a clear type for frontend
    message: reply,
    resultType,
    data: resultData
  }));

  // Notify the end of the response (optional)
  ws.send(JSON.stringify({ type: "aiEnd" }));
  return; // Don't return REST response
}

    return res.status(200).json({
      success: true,
      reply,
      type: resultType,
      data: resultData,
    });
  } catch (error) {
    console.error("ASK AI Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = askAI;
