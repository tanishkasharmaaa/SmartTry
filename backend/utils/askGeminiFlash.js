const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/* -------------------- INTENT HELPERS -------------------- */

const isThankYou = (q) =>
  /(thanks|thank you|thx|ty|thanks a lot)/i.test(q.trim());

const isAboutSmartTry = (q) =>
  /(what is smarttry|about smarttry|who are you|who is smarttry|what do you do)/i.test(
    q.trim()
  );

const isConfusedFashionIntent = (q) =>
  /(i'?m confused|confused what to buy|don'?t know what to wear|help me choose|suggest something)/i.test(
    q.trim()
  );

const isRandomNonShopping = (q) =>
  /(what is coding|what is ai|what is javascript|who is|what is life|tell me a joke)/i.test(
    q.trim()
  );

/* -------------------- SMART REPLIES -------------------- */

const getThankYouReply = () => {
  const replies = [
    "😊 You’re welcome! Let me know if you want help finding outfits.",
    "Anytime! 👕👗 I’m here to help you shop smarter.",
    "Happy to help! 🛍️ Tell me what you’d like to wear next.",
  ];
  return replies[Math.floor(Math.random() * replies.length)];
};

const getFallbackReply = () => {
  return "😊 I’m here to help you with clothing and outfit suggestions. Try asking things like *“show me men’s casual shirts”* or *“party wear for women”*.";
};

/* -------------------- MAIN FUNCTION -------------------- */

async function askGeminiFlash(
  query,
  products = [],
  categories = [],
  context = {}
) {
  try {
    if (!query || !query.trim()) return null;

    /* 🙏 THANK YOU */
    if (isThankYou(query)) {
      return {
        resultType: "message",
        data: [{ type: "message", text: getThankYouReply() }],
      };
    }

    /* 🤖 ABOUT SMARTTRY */
    if (isAboutSmartTry(query)) {
      return {
        resultType: "message",
        data: [
          {
            type: "message",
            text: "🤖 I’m SmartTry AI — your fashion shopping assistant. I help you find the right clothes based on style, gender, price, and trends.",
          },
        ],
      };
    }

    /* 😕 CONFUSED USER */
    if (isConfusedFashionIntent(query)) {
      return {
        resultType: "message",
        data: [
          {
            type: "message",
            text: "No worries 😊 Let’s figure it out together. Are you shopping for men or women, and is it for casual, office, or party wear?",
          },
        ],
      };
    }

    /* ❓ RANDOM / OUT-OF-SCOPE QUESTIONS */
    if (isRandomNonShopping(query)) {
      return {
        resultType: "message",
        data: [{ type: "message", text: getFallbackReply() }],
      };
    }

    /* 🛑 NO PRODUCTS */
    if (!products.length) return null;

    /* 🛍️ PRODUCT SELECTION (GEMINI) */
    const productList = products.slice(0, 20);

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `
You are **SmartTry AI**, a fashion-only ecommerce assistant.

IMPORTANT:
SmartTry ONLY helps with clothing recommendations.
If the query is NOT about buying or choosing clothes, return [].

STRICT RULES:
- Use ONLY products from the list below
- NEVER invent or rename products
- NEVER return text outside JSON
- If nothing matches, return []
- Return 3–8 best matching clothing products

AVAILABLE PRODUCTS (JSON):
${JSON.stringify(
  productList.map((p) => ({
    name: p.name,
    category: p.category,
    price: p.price,
    gender: p.gender || "Unisex",
    rating: p.rating || 0,
    tags: p.tags || [],
  })),
  null,
  2
)}

USER CONTEXT:
- Interests: ${context.userInterests?.join(", ") || "none"}
- Cart preferences: ${context.cartTags?.join(", ") || "none"}
- Preferred gender: ${context.gender || "any"}

USER QUERY:
"${query}"

RESPONSE FORMAT (ONLY JSON):
[
  {
    "name": "Exact product name from list",
    "reason": "Short, friendly reason why this outfit suits the customer"
  }
]
`,
          },
        ],
      },
    ];

    const response = await genAI.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents,
    });

    let text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    text = text.replace(/```json|```/g, "").trim();

    const selected = JSON.parse(text);
    console.log("💡 Gemini Flash selected:", selected);

    if (!Array.isArray(selected) || selected.length === 0) return null;

    const selectedNames = selected.map((s) => s.name);

    const finalProducts = productList.filter((p) =>
      selectedNames.includes(p.name)
    );

    if (!finalProducts.length) return null;

    return {
      resultType: "products",
      data: finalProducts,
    };
  } catch (err) {
    console.error("❌ Gemini Flash Error:", err.message);
    return {
      resultType: "message",
      data: [{ type: "message", text: getFallbackReply() }],
    };
  }
}

module.exports = askGeminiFlash;
