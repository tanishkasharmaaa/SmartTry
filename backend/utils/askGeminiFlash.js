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
  /(show|find|buy|shop|dress|shirt|hoodie|t-shirt|trousers|jeans|top|outfit|casual|party|men|women|unisex|girls|boys|kids)/i.test(
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

    /* =========================================
       2️⃣ AI → STRUCTURED ENTITY & KEYWORD EXTRACTION
    ========================================= */

    const prompt = `
You are an e-commerce search assistant.
Extract search keywords, price limits, gender/demographics, and categories from the user query.

Return ONLY a valid JSON object matching this schema:
{
  "searchKeywords": "string of clean product terms without price or filler words",
  "maxPrice": number or null,
  "gender": "Men" | "Women" | "Unisex" | "Girls" | "Boys" | null,
  "category": "string or null"
}

Example Input: "show me dresses under 2000 for girls"
Example Output:
{
  "searchKeywords": "dresses",
  "maxPrice": 2000,
  "gender": "Girls",
  "category": "dresses"
}

USER QUERY:
"${cleanQuery}"
`;

    const response = await genAI.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const rawText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    let extractedData = {};

    try {
      extractedData = JSON.parse(rawText || "{}");
    } catch (parseErr) {
      console.error("JSON parsing error:", parseErr);
      extractedData = { searchKeywords: cleanQuery };
    }

    console.log("Extracted Criteria:", extractedData);

    /* =========================================
       3️⃣ DYNAMIC MONGODB QUERY BUILDER
    ========================================= */

    const dbQuery = {};

    // 1. Apply $text search for product search keywords
    if (extractedData.searchKeywords) {
      dbQuery.$text = { $search: extractedData.searchKeywords };
    }

    // 2. Apply price condition if extracted
    if (extractedData.maxPrice) {
      dbQuery.price = { $lte: Number(extractedData.maxPrice) };
    }

    // 3. Apply gender/demographic filter if extracted
    if (extractedData.gender) {
      dbQuery.gender = new RegExp(`^${extractedData.gender}$`, "i");
    }

    // 4. Apply category filter if extracted
    if (extractedData.category) {
      dbQuery.category = new RegExp(extractedData.category, "i");
    }

    /* =========================================
       4️⃣ DATABASE SEARCH WITH FALLBACK
    ========================================= */

   /* =========================================
       4️⃣ DATABASE SEARCH WITH FALLBACK
    ========================================= */

    let products = [];

    if (Object.keys(dbQuery).length > 0) {
      const projection = dbQuery.$text ? { score: { $meta: "textScore" } } : {};
      const sort = dbQuery.$text ? { score: { $meta: "textScore" } } : { createdAt: -1 };

      products = await ProductModel.find(dbQuery, projection)
        .sort(sort)
        .limit(20);
    }

    // Fallback: If strict filtered search yields no results, attempt broader text search
    if (!products.length && extractedData.searchKeywords) {
      products = await ProductModel.find(
        { $text: { $search: extractedData.searchKeywords } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(20);
    }

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
          text: "😔 No products found. Try searching with different keywords.",
        },
      ],
    };
  }
}

module.exports = askGeminiFlash;