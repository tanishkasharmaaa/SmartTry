const { GoogleGenAI } = require("@google/genai");
const retrieveRelevantProducts = require("../utils/retrieveProducts");
const ProductModel = require("../model/products"); // your mongoose model

require("dotenv").config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/* -------------------- INTENT HELPERS -------------------- */
const isGreeting = (q) =>
  /^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(q.trim());
const isThankYou = (q) => /(thank(s| you)|thx)/i.test(q.trim());
const isAboutSmartTry = (q) =>
  /(what is smarttry|about smarttry|who are you|who is smarttry|what do you do)/i.test(
    q.trim(),
  );
const isConfusedFashionIntent = (q) =>
  /(i'?m confused|confused what to buy|don'?t know what to wear|help me choose|suggest something|confused)/i.test(
    q.trim(),
  );

const isRandomNonShopping = (q) =>
  /(what is coding|what is ai|what is javascript|who is|what is life|tell me a joke)/i.test(
    q.trim(),
  );
const isShoppingIntent = (q) =>
  /(show|find|buy|shop|casual|party|dress|shirt|hoodie|t-shirt|trousers|jeans|top|outfit|men's|women's|for men|for women)/i.test(
    q,
  );

/* -------------------- SMART REPLIES -------------------- */
const getGreetingReply = () => {
  const replies = [
    "👋 Hello! How can I help you with your fashion choices today?",
    "Hi there! 😊 Looking for something stylish today?",
    "Hey! 🛍️ Ready to explore some amazing outfits?",
  ];
  return replies[Math.floor(Math.random() * replies.length)];
};
const getThankYouReply = () => {
  const replies = [
    "😊 You’re welcome! Let me know if you want help finding outfits.",
    "Anytime! 👕👗 I’m here to help you shop smarter.",
    "Happy to help! 🛍️ Tell me what you’d like to wear next.",
  ];
  return replies[Math.floor(Math.random() * replies.length)];
};

const getFallbackReply = () =>
  "😊 I’m here to help you with clothing and outfit suggestions. Try asking things like *“show me men’s casual shirts”* or *“party wear for women”*.";

/* -------------------- MAIN FUNCTION -------------------- */
async function askGeminiFlash(
  query,
  products = [],
  categories = [],
  context = {},
) {
  console.log(query, "-----ai");
  try {
   if (!query || !query.trim()) {
  return {
    resultType: "message",
    data: [
      {
        type: "message",
        text: "Please enter something to search.",
      },
    ],
  };
} // <-- return null if no query

    // Combine current query + previous user messages for multi-turn context
    const fullConversation = [
      query,
      ...(context.history?.map((h) => h.user) || []),
    ].join(" ");

    // 1️⃣ Handle simple intents
    if (isGreeting(fullConversation))
      return {
        resultType: "message",
        data: [{ type: "message", text: getGreetingReply() }],
      };
    if (isThankYou(fullConversation))
      return {
        resultType: "message",
        data: [{ type: "message", text: getThankYouReply() }],
      };
    if (isAboutSmartTry(fullConversation))
      return {
        resultType: "message",
        data: [
          {
            type: "message",
            text: "🤖 I’m SmartTry AI — your fashion shopping assistant. I help you find the right clothes based on style, gender, price, and trends.",
          },
        ],
      };
    if (isConfusedFashionIntent(fullConversation))
      return {
        resultType: "message",
        data: [
          {
            type: "message",
            text: "No worries 😊 Let’s figure it out together. Are you shopping for men or women, and is it for casual, office, or party wear?",
          },
        ],
      };

    if (isRandomNonShopping(fullConversation))
      return {
        resultType: "message",
        data: [{ type: "message", text: getFallbackReply() }],
      };
    // Only retrieve products when shopping intent exists
    if (!isShoppingIntent(fullConversation)) {
  return {
    resultType: "message",
    data: [
      {
        type: "message",
        text: getFallbackReply(),
      },
    ],
  };
}
    const productList = await retrieveRelevantProducts(
      ProductModel,
      fullConversation,
      30,
    );

    if (!productList.length) return { resultType: "products", data: [] };

    /* ---------- COMPACT PRODUCTS FOR AI ---------- */

    const compactProducts = productList.map((p, i) => ({
      id: i + 1,
      n: p.name,
      c: p.category,
      pr: p.price,
      g: p.gender || "Unisex",
      r: p.rating || 0,
      t: p.tags || [],
      image: p.image || null,
    }));

    const historyText = JSON.stringify(
      context.history?.map((h) => ({ user: h.user, ai: h.ai })) || [],
    );

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `You are **SmartTry AI**, a fashion-only ecommerce assistant.

==============================
ORDER HANDLING RULES (VERY IMPORTANT):
==============================
- If the user asks about order status AND no order ID is provided:
  → Respond ONLY with:
    📦 Please provide your Order ID like this: Track my order #df507cf2

- If the user ALREADY provides an order ID (example: #df507cf2):
  → Respond ONLY with:
    📦 Got it! I’m checking the status of your order #<ORDER_ID>. Please wait ⏳

- NEVER ask for the order ID again if it is already present
- NEVER invent order details
- NEVER return product recommendations for order-related queries
- ORDER QUERIES MUST RETURN PLAIN TEXT (NOT JSON)
- If a query contains BOTH order-related intent AND shopping intent:
  → PRIORITIZE order handling and ignore shopping intent completely

==============================
VAGUE SHOPPING INTENT HANDLING (VERY IMPORTANT):
==============================
- If the user asks for recommendations WITHOUT specifying clear details
  (examples: "show me something", "recommend as per my interest", "suggest something for me"):
  → Respond ONLY with the following plain text (NO JSON):

  😊 Sure! Tell me about your styling so I can show you products accordingly.
  • Shopping for men or women?
  • Occasion: casual, office, weddings, farewell party or party ?
  • Any budget preference?

- DO NOT recommend products until these details are provided
- DO NOT return JSON for vague shopping queries
- Ask this clarification ONLY ONCE per conversation
- If required details already exist in USER CONTEXT or USER HISTORY, DO NOT ask again

==============================
SMART CLARIFICATION & INFERENCE RULES:
==============================
- If the shopping intent is clear but some details are missing:
  - Infer preferences from USER CONTEXT and USER HISTORY when possible
  - Infer gender, occasion, or budget only if confidence is high
  - If confidence is low, ask a clarification question instead of guessing
- Never ask unnecessary follow-up questions

==============================
IMPORTANT (FOR SHOPPING QUERIES ONLY):
==============================
- Only recommend clothing products from the AVAILABLE PRODUCTS list
- Do NOT invent products, brands, prices, or categories
- Return a JSON array of 5–8 products
- If no products match, return an empty JSON array []
  Return ONLY JSON array:
[
  { "id": 3, "reason": "Perfect for party wear" }
]
- NEVER include any text outside JSON for shopping queries

==============================
RECOMMENDATION QUALITY RULES:
==============================
- Prefer higher-rated products when multiple options match
- Ensure variety (avoid recommending very similar items)
- Match products closely with:
  - User interests
  - Cart preferences
  - Occasion and budget
- Do NOT repeat the same category excessively unless requested

==============================
REASON FIELD RULES:
==============================
- Each recommended product MUST include a short "reason"
- Reason must reference user preference, occasion, or budget
- Keep reason concise (maximum 1 sentence)
- Do NOT include emojis inside JSON

==============================
NO MATCH HANDLING:
==============================
- If no suitable products are found:
  → Return [] only
- Do NOT explain
- Do NOT suggest alternatives unless explicitly asked

==============================
BRAND VOICE & STYLE:
==============================
- Friendly, confident, and helpful
- Emojis allowed ONLY in plain-text responses
- Never sound uncertain or apologetic
- Never break format rules

==============================
AVAILABLE PRODUCTS (JSON):
==============================
${JSON.stringify(compactProducts, null, 2)}

==============================
USER CONTEXT:
==============================
- Interests: ${context.userInterests?.join(", ") || "none"}
- Cart preferences: ${context.cartTags?.join(", ") || "none"}
- Preferred gender: ${context.gender || "any"}

==============================
USER HISTORY:
==============================
${historyText}

==============================
USER QUERY:
==============================
"${query}"

==============================
RESPONSE FORMAT (STRICT):
==============================
- If returning JSON, output VALID PARSEABLE JSON ONLY (no markdown, no code blocks, no extra text before or after)
- Order-related queries → Plain text only
- Vague shopping queries → Plain text only
- Shopping queries → JSON array ONLY
`,
          },
        ],
      },
    ];

    const response = await genAI.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents,
    });

    let text = response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      return {
        resultType: "message",
        data: [
          {
            type: "message",
            text: "⚠️ AI response failed. Please try again.",
          },
        ],
      };
    }

    text = text.trim();

    // remove code fences if any
    text = text.replace(/```json|```/g, "").trim();

    console.log("🤖 Gemini raw output:", text);

    // ✅ CASE 1: JSON → product recommendations
    if (text.startsWith("[")) {
      let selected = [];

      try {
        selected = JSON.parse(text);
      } catch (err) {
        console.error("JSON parse failed:", err.message);
        return {
          resultType: "message",
          data: [
            {
              type: "message",
              text: "⚠️ I had trouble understanding that. Please try again.",
            },
          ],
        };
      }

    const finalProducts = selected
  .map((s) => {
    const product = productList[s.id - 1];
    if (!product) return null;

    return {
      _id: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      gender: product.gender,
      rating: product.rating,
      tags: product.tags,
      image: product.image,
      reason: s.reason || "",
    };
  })
  .filter(Boolean);

// ✅ Handle empty results
if (!finalProducts.length) {
  return {
    resultType: "message",
    data: [
      {
        type: "message",
        text: "😔 I couldn’t find matching products. Try searching like:\n\n• Casual outfits for men\n• Party wear for women\n• Black sneakers under ₹2000\n• Trending summer fashion",
      },
    ],
  };
}

return {
  resultType: "products",
  data: finalProducts,
};
}

// ✅ CASE 2: Plain text → message
if (text.length) {
  return {
    resultType: "message",
    data: [{ type: "message", text }],
  };
}

return {
  resultType: "message",
  data: [
    {
      type: "message",
      text: "🤔 I couldn’t understand that. Try searching something like:\n\n• Casual outfits for men\n• Party wear for women\n"
    },
  ],
};
 } catch (err) {
  console.error("Gemini Error:", err.message);
  return {
    resultType: "message",
    data: [
      {
        type: "message",
        text: "⚠️ AI service is temporarily unavailable. Please try again.",
      },
    ],
  };
}
}

module.exports = askGeminiFlash;
