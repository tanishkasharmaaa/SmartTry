const { GoogleGenAI } = require("@google/genai");
const ProductModel = require("../model/products");
require("dotenv").config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/* ---------------- INTENT HELPERS ---------------- */

const isGreeting = (q) =>
  /^(hi|hello|hey|good morning|good evening)$/i.test(q.trim());

const isOrderQuery = (q) => /(track|order|status)/i.test(q);

const extractOrderId = (q) => {
  const match = q.match(/#([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

const isShoppingIntent = (q) =>
  /(show|find|buy|shop|dress|shirt|jeans|outfit|casual|party|men|women)/i.test(
    q,
  );

/* ---------------- MAIN FUNCTION ---------------- */

async function askGeminiFlash(query) {
  try {
    if (!query?.trim()) {
      return {
        resultType: "message",
        data: [{ type: "message", text: "Please enter something to search." }],
      };
    }

    const cleanQuery = query.trim();

    /* 1️⃣ Simple replies */
    if (isGreeting(cleanQuery)) {
      return {
        resultType: "message",
        data: [{ type: "message", text: "👋 Hello! What are you looking for?" }],
      };
    }

    /* 2️⃣ Order Handling */
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

    /* ==========================================
       3️⃣ AI → Convert query into filters JSON
    =========================================== */

    const prompt = `
You are a shopping query parser.

Convert the user query into structured JSON filters.

Return ONLY valid JSON.
No markdown.
No explanation.

Format:
{
  "gender": "",
  "category": "",
  "color": "",
  "occasion": "",
  "minPrice": 0,
  "maxPrice": 0,
  "sortBy": "price_low_to_high | price_high_to_low | rating | newest"
}

If a field is not mentioned, return null.

USER QUERY:
"${cleanQuery}"
`;

    const response = await genAI.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    text = text.replace(/```json|```/g, "").trim();

    let filters;

    try {
      filters = JSON.parse(text);
    } catch {
      return {
        resultType: "message",
        data: [{ type: "message", text: "⚠️ Could not understand search." }],
      };
    }

    /* ==========================================
       4️⃣ BUILD MONGODB QUERY
    =========================================== */

    const mongoQuery = {};

    if (filters.gender)
      mongoQuery.gender = new RegExp(filters.gender, "i");

    if (filters.category)
      mongoQuery.category = new RegExp(filters.category, "i");

    if (filters.color)
      mongoQuery.color = new RegExp(filters.color, "i");

    if (filters.occasion)
      mongoQuery.tags = { $in: [new RegExp(filters.occasion, "i")] };

    if (filters.minPrice || filters.maxPrice) {
      mongoQuery.price = {};
      if (filters.minPrice)
        mongoQuery.price.$gte = Number(filters.minPrice);
      if (filters.maxPrice)
        mongoQuery.price.$lte = Number(filters.maxPrice);
    }

    /* ==========================================
       5️⃣ SORT LOGIC
    =========================================== */

    let sortOption = {};

    switch (filters.sortBy) {
      case "price_low_to_high":
        sortOption.price = 1;
        break;
      case "price_high_to_low":
        sortOption.price = -1;
        break;
      case "rating":
        sortOption.rating = -1;
        break;
      case "newest":
        sortOption.createdAt = -1;
        break;
      default:
        sortOption.rating = -1;
    }

    /* ==========================================
       6️⃣ DATABASE SEARCH (Scalable)
    =========================================== */

    const products = await ProductModel.find(mongoQuery)
      .sort(sortOption)
      .limit(20);

    return {
      resultType: "products",
      data: products,
    };
  } catch (err) {
    console.error("Error:", err.message);
    return {
      resultType: "message",
      data: [
        { type: "message", text: "⚠️ Something went wrong. Try again." },
      ],
    };
  }
}

module.exports = askGeminiFlash;