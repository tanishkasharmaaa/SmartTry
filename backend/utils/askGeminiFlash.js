const { GoogleGenAI } = require("@google/genai");
const ProductModel = require("../model/products");
require("dotenv").config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/* -------------------- INTENT HELPERS -------------------- */

const isGreeting = (q) =>
  /^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(q.trim());

const isThankYou = (q) => /(thank(s| you)|thx)/i.test(q);

const isOrderQuery = (q) => /(track|order|status)/i.test(q);

const extractOrderId = (q) => {
  const match = q.match(/#([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

const isShoppingIntent = (q) =>
  /(show|find|buy|shop|dress|shirt|hoodie|t-shirt|trousers|jeans|top|outfit|casual|party|men|women|unisex)/i.test(
    q
  );

/* -------------------- MAIN FUNCTION -------------------- */

async function askGeminiFlash(query) {
  try {
    if (!query || !query.trim()) {
      return {
        resultType: "message",
        data: [{ type: "message", text: "Please enter something to search." }],
      };
    }

    const cleanQuery = query.trim();

    /* =============================
       1️⃣ SIMPLE INTENTS
    ============================== */

    if (isGreeting(cleanQuery)) {
      return {
        resultType: "message",
        data: [
          { type: "message", text: "👋 Hello! What are you shopping for today?" },
        ],
      };
    }

    if (isThankYou(cleanQuery)) {
      return {
        resultType: "message",
        data: [{ type: "message", text: "😊 You're welcome!" }],
      };
    }

    if (isOrderQuery(cleanQuery)) {
      const orderId = extractOrderId(cleanQuery);

      if (!orderId) {
        return {
          resultType: "message",
          data: [
            {
              type: "message",
              text: "📦 Please provide your Order ID like: Track my order #123abc",
            },
          ],
        };
      }

      return {
        resultType: "message",
        data: [
          {
            type: "message",
            text: `📦 Checking status of order #${orderId} ⏳`,
          },
        ],
      };
    }

    if (!isShoppingIntent(cleanQuery)) {
      return {
        resultType: "message",
        data: [
          {
            type: "message",
            text:
              "Try searching like:\n• Casual shirts for men\n• Party dresses under ₹3000",
          },
        ],
      };
    }

    /* =============================
       2️⃣ AI → IMPROVE QUERY (NOT PRODUCTS)
    ============================== */

    const prompt = `
You are an ecommerce search assistant.

Rewrite the user's shopping query into a clean, keyword-optimized search query.

Return ONLY plain text.
No explanation.

Example:
Input: "show me something cool for party"
Output: "party wear outfit"

USER QUERY:
"${cleanQuery}"
`;

    const response = await genAI.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let improvedQuery =
      response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      cleanQuery;

    improvedQuery = improvedQuery.replace(/```/g, "").trim();

    console.log("Improved Query:", improvedQuery);

    /* =============================
       3️⃣ HYBRID SEARCH (NO EMPTY ARRAY ISSUE)
    ============================== */

    // First try text search
    let products = await ProductModel.find(
      { $text: { $search: improvedQuery } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(20);

    // 🔥 Fallback if text search fails
    if (!products.length) {
      return {
        resultType: "message",
        data: [
          {
            type: "message",
            text:
              "😔 No products found. Try searching like:\n\n• Casual shirts for men\n• Party dresses\n• Hoodies under ₹2000\n• Summer outfits",
          },
        ],
      };
    }

    /* =============================
       5️⃣ RETURN PRODUCTS
    ============================== */

    return {
      resultType: "products",
      data: products,
    };
  } catch (err) {
    console.error("Search Error:", err.message);

    return {
      resultType: "message",
      data: [
        {
          type: "message",
          text:
            "😔 No products found. Try searching with different keywords.",
        },
      ],
    };
  }
}

module.exports = askGeminiFlash;