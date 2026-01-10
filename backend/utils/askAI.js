// controllers/askAI.js
const { GoogleGenAI } = require("@google/genai");
const productModel = require("../model/products");
const recommendProducts = require("./recommendProducts");
require("dotenv").config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --------------------------- HELPER FUNCTIONS ---------------------------

// Ask Gemini AI with conversation history and available products/categories
async function askGeminiFlash(query, products = [], categories = [], history = []) {
  try {
    // Limit products to top 20 for prompt size
    const productList = products.slice(0, 20);

    const contents = [
      ...history,
      {
        role: "user",
        parts: [
          {
            text: `
You are SmartTry AI, an expert ecommerce recommendation assistant.

Your task is to RECOMMEND relevant products to the user based on:
• User interests
• Cart behavior
• Product tags
• Category similarity
• Gender preference (if any)

STRICT RULES:
- ONLY recommend from the products listed below.
- NEVER invent products or categories.
- If nothing matches well, return an EMPTY JSON ARRAY [].
- Return ONLY valid JSON (no markdown, no explanation text).
- Each description must explain WHY it is recommended.

AVAILABLE CATEGORIES:
${categories.join(", ")}

AVAILABLE PRODUCTS (name | category | price | gender | rating | discount | tags | image):
${productList
  .map(
    p =>
      `${p.name} | ${p.category} | ${p.price} | ${p.gender} | ${p.rating || 0} | ${p.discount || 0} | ${p.tags?.join(", ")}`
  )
  .join("\n")}

USER CONTEXT:
- Interests: ${history?.userInterests?.join(", ") || "unknown"}
- Cart tags: ${history?.cartTags?.join(", ") || "none"}
- Gender preference: ${history?.gender || "any"}

USER QUERY:
"${query}"

RESPONSE FORMAT (JSON ONLY):
[
  {
    "name": "Product name (exact match)",
    "category": "Category",
    "price": 1000,
    "gender": "Men/Women/Unisex",
    "rating": 0,
    "image": "image_url_if_available",
    "description": "Why this product matches the user's interest or cart"
  }
]

IMPORTANT:
- Return 3–8 products only.
- Prefer products with matching tags or same category as cart items.
- If user asked for “best” or “quality”, prefer higher rating or popular tags.
`,
          },
        ],
      },
    ];

    const response = await genAI.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents,
    });

    // Extract text and sanitize
    let text = response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";
    text = text.replace(/^```json/, "").replace(/```$/, "").trim();

    try {
      return JSON.parse(text);
    } catch (err) {
      console.warn("AI returned invalid JSON, fallback to empty array.", text);
      return [];
    }
  } catch (err) {
    console.error("Gemini Flash Error:", err);
    return [];
  }
}

function extractKeywords(query) {
  return query
    .toLowerCase()
    .replace(/show me|show|i want|give me|find|buy|please|can you/g, "")
    .replace(/[^\w\s]/g, "")
    .split(" ")
    .filter(word => word.length > 2);
}


// Fallback messages if DB has no result
function aiLikeFallbackMessage(query, resultType) {
  const q = query.toLowerCase();

  if (resultType === "products") {
    return [
      {
        type: "message",
        text: `I couldn't find exact products for **"${query}"** 🤔\n\n` +
          "You can try:\n• Products under 3000\n• Men or Women products\n• Trending products\n• Category like Clothing or Footwear",
      },
    ];
  }

  if (resultType === "categories") {
    return [
      {
        type: "message",
        text: "Here are the categories we currently have 👇\n\n• Men\n• Women\n• Unisex\n• Accessories\n• Footwear",
      },
    ];
  }

  if (/hello|hi|hey/.test(q)) {
    return [
      {
        type: "message",
        text: "Hey there 👋 I’m SmartTry AI.\n\nI can help you find:\n• Men / Women products\n• Trending items\n• Products by price\n• Categories available",
      },
    ];
  }

  return [
    {
      type: "message",
      text: `I didn’t fully understand **"${query}"** 🤔\n\nTry asking like:\n• Show products under 5000\n• Best shoes for men\n• Trending products\n• What categories do you have?\n\nI’m here to help 😊`,
    },
  ];
}

// --------------------------- MAIN API ---------------------------

const askAI = async (req, res, ws = null, conversationHistory = []) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: "Query is required" });

    const q = query.toLowerCase();
    let resultType = "general";
    let resultData = [];

    // Fetch all products and categories for AI reference
    const categories = await productModel.distinct("category");
    const allProducts = await productModel.find({}).lean();

    // ---------------- SHORT INPUT ----------------
    if (q.length <= 2) {
      const reply = [{ type: "message", text: "Can you please tell me what you're looking for? 😊" }];
      if (ws?.readyState === 1) {
        ws.send(JSON.stringify({ type: "aiMessage", resultType: "message", data: reply }));
        ws.send(JSON.stringify({ type: "aiEnd" }));
        return;
      }
      return res.json({ success: true, type: "message", data: reply });
    }

    // ---------------- GREETING ----------------
    const greetings = ["hi", "hello", "hey", "good morning", "good evening"];
    if (greetings.some(g => q === g || q.startsWith(g))) {
      const reply = [
        { type: "message", text: "Hello 👋 I can help you find products.\n• Men products\n• Women products\n• Trending products\n• Categories available" },
      ];
      if (ws?.readyState === 1) {
        ws.send(JSON.stringify({ type: "aiMessage", resultType: "message", data: reply }));
        ws.send(JSON.stringify({ type: "aiEnd" }));
        return;
      }
      return res.json({ success: true, type: "message", data: reply });
    }

    // ---------------- INTENT DETECTION ----------------
    const genders = [];
    if (/(men|mens|boys|male|males|man)/i.test(q)) genders.push("Men");
    if (/(women|womens|girls|ladies|female|females|woman)/i.test(q)) genders.push("Women");
    if (/(unisex|both)/i.test(q)) genders.push("Unisex");

    // Category intent
    const categoryIntents = [
      "category","categories","what category","what categories","which category","which categories",
      "product category","product categories","categories available","what products do you have",
      "what all products","what do you sell","product types",
    ];
    if (categoryIntents.some(intent => q.includes(intent))) {
      resultType = "categories";
      resultData = categories;
      if (ws?.readyState === 1) {
        ws.send(JSON.stringify({ type: "aiMessage", resultType: "categories", data: resultData }));
        ws.send(JSON.stringify({ type: "aiEnd" }));
        return;
      }
      return res.json({ success: true, type: "categories", data: resultData });
    }

    // Trending / popular products
    if (/trending|popular|hot|most sold|top selling/.test(q)) {
      resultType = "products";
      resultData = await productModel
        .find({ tags: { $in: ["trending", "popular"] } })
        .sort({ soldCount: -1 })
        .limit(10)
        .lean();
    }

    // ---------------- PRODUCT FILTERS ----------------
if (resultType !== "products") {
  let filter = {};
  if (genders.length) filter.gender = { $in: genders };
  if (/under|below|less than/.test(q)) {
    const match = q.match(/(\d+)/);
    if (match) filter.price = { $lte: Number(match[1]) };
  }
  if (q.includes("between") && q.includes("and")) {
    const match = q.match(/between\s+(\d+)\s+and\s+(\d+)/);
    if (match) filter.price = { $gte: Number(match[1]), $lte: Number(match[2]) };
  }
  const matchedCategory = categories.find(c => q.includes(c.toLowerCase()));
  if (matchedCategory) filter.category = matchedCategory;

  if (Object.keys(filter).length) {
    resultType = "products";
    resultData = await productModel.find(filter).lean();
  }
}

// ---------------- PERSONALIZED RECOMMENDATIONS ----------------
if (/recommend|suggest|for me|you may like|based on my interest/.test(q)) {
  resultType = "products";

  const user = req.user || {}; // assuming auth middleware
  const cartItems = user.cart || [];

  const recommended = await recommendProducts({
    userInterests: user.interests || [],
    cartProductIds: cartItems.map(i => i.productId),
    gender: user.gender,
    limit: 10,
  });

  if (recommended.length) {
    resultData = recommended;
  }
}

// ---------------- GENERIC PRODUCT KEYWORD SEARCH ----------------
const keywords = extractKeywords(q);

if (keywords.length) {
  const regexArray = keywords.map(word => new RegExp(word, "i"));

  resultType = "products";
  resultData = await productModel.find({
    $or: [
      { name: { $in: regexArray } },
      { tags: { $in: keywords } }
    ]
  }).lean();

  if (resultData.length > 0) {
    if (ws?.readyState === 1) {
      ws.send(JSON.stringify({
        type: "aiMessage",
        resultType,
        data: resultData
      }));
      ws.send(JSON.stringify({ type: "aiEnd" }));
      return;
    }

    return res.json({
      success: true,
      type: resultType,
      data: resultData
    });
  }
}


// ---------------- FALLBACK TO AI ----------------
if (!resultData || resultData.length === 0) {
  // Prepare relevant products for AI (optional: filter top 20 to avoid prompt size issues)
  const aiRelevantProducts = allProducts.slice(0, 20);

  const aiResponse = await askGeminiFlash(query, aiRelevantProducts, categories, conversationHistory);
  console.log("Gemini Flash AI Response:", aiResponse);

  let reply;
  
  // If AI returned valid products (array), use it
  if (Array.isArray(aiResponse) && aiResponse.length > 0) {
    resultType = "products";
    resultData = aiResponse;
  } else {
    // AI returned empty or invalid data, fallback to friendly message
    reply = aiLikeFallbackMessage(query, "general");
    if (ws?.readyState === 1) {
      ws.send(JSON.stringify({ type: "aiMessage", resultType: "message", data: reply, ai: true }));
      ws.send(JSON.stringify({ type: "aiEnd" }));
      return;
    }
    return res.json({ success: true, type: "message", data: reply, ai: true });
  }
}

    // ---------------- RESPONSE ----------------
    if (resultType === "products") {
      resultData = resultData.map(p => ({
        name: p.name,
        price: p.price,
        description: p.description,
        category: p.category,
        gender: p.gender,
        image: p.image,
        rating: p.rating,
        discount: p.discount,
        tags: p.tags,
      }));
    }

    if (ws?.readyState === 1) {
      ws.send(JSON.stringify({ type: "aiMessage", resultType, data: resultData }));
      ws.send(JSON.stringify({ type: "aiEnd" }));
      return;
    }

    res.json({ success: true, type: resultType, data: resultData });
  } catch (error) {
    console.error("ASK AI ERROR:", error);
    if (ws?.readyState === 1) {
      ws.send(JSON.stringify({ type: "aiError", message: error.message }));
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = askAI;
