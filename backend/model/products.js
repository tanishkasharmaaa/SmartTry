const { GoogleGenAI } = require("@google/genai");
const ProductModel = require("../model/products");
require("dotenv").config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/* ---------------- SIMPLE INTENTS ---------------- */

const isGreeting = (q) =>
  /^(hi|hello|hey|good morning|good evening)$/i.test(q.trim());

const isOrderQuery = (q) => /(track|order|status)/i.test(q);

const extractOrderId = (q) => {
  const match = q.match(/#([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

const isShoppingIntent = (q) =>
  /(show|find|buy|shop|dress|shirt|jeans|t-shirt|hoodie|outfit|casual|party|men|women|unisex)/i.test(
    q
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

    /* =============================
       1️⃣ SIMPLE REPLIES
    ============================== */

    if (isGreeting(cleanQuery)) {
      return {
        resultType: "message",
        data: [{ type: "message", text: "👋 Hello! What are you shopping for today?" }],
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
       2️⃣ AI → Extract Filters ONLY
    ============================== */

    const prompt = `
You are an ecommerce query parser.

Convert the user query into structured JSON filters.

Return ONLY valid JSON.
No explanation.
No markdown.

Format:
{
  "gender": null,
  "category": null,
  "minPrice": null,
  "maxPrice": null,
  "size": null,
  "sortBy": null
}

Allowed values:
gender: "Men", "Women", "Unisex"
sortBy: "price_low_to_high", "price_high_to_low", "rating", "newest"

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

    let filters = {};

    try {
      filters = JSON.parse(text);
    } catch {
      filters = {};
    }

    /* =============================
       3️⃣ BUILD MONGO QUERY
    ============================== */

    const mongoQuery = {};

    // 🔥 TEXT SEARCH (Main powerful search)
    mongoQuery.$text = { $search: cleanQuery };

    // 🔥 Gender
    if (filters.gender) {
      mongoQuery.gender = filters.gender;
    }

    // 🔥 Category (extra filter if AI extracted)
    if (filters.category) {
      mongoQuery.category = { $regex: filters.category, $options: "i" };
    }

    // 🔥 Size
    if (filters.size) {
      mongoQuery.size = filters.size;
    }

    // 🔥 Price
    if (filters.minPrice || filters.maxPrice) {
      mongoQuery.price = {};
      if (filters.minPrice)
        mongoQuery.price.$gte = Number(filters.minPrice);
      if (filters.maxPrice)
        mongoQuery.price.$lte = Number(filters.maxPrice);
    }

    /* =============================
       4️⃣ SORTING
    ============================== */

    let sortOption = { score: { $meta: "textScore" } };

    if (filters.sortBy === "price_low_to_high") sortOption = { price: 1 };
    if (filters.sortBy === "price_high_to_low") sortOption = { price: -1 };
    if (filters.sortBy === "rating") sortOption = { averageRating: -1 };
    if (filters.sortBy === "newest") sortOption = { createdAt: -1 };

    /* =============================
       5️⃣ EXECUTE SEARCH
    ============================== */

    const products = await ProductModel.find(mongoQuery, {
      score: { $meta: "textScore" },
    })
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
        {
          type: "message",
          text: "⚠️ Something went wrong. Please try again.",
        },
      ],
    };
  }
}

module.exports = askGeminiFlash;