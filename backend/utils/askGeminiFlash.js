const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/* -------------------- INTENT HELPERS -------------------- */
const isGreeting = (q) =>
  /^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(q.trim());
const isThankYou = (q) => /(thank(s| you)|thx|ty)/i.test(q.trim());
const isAboutSmartTry = (q) =>
  /(what is smarttry|about smarttry|who are you|who is smarttry|what do you do)/i.test(q.trim());
const isConfusedFashionIntent = (q) =>
  /(i'?m confused|confused what to buy|don'?t know what to wear|help me choose|suggest something|confused)/i.test(q.trim());
const isOrderIntent = (q) =>
  /(my order|order status|track order|order details|where is my order)/i.test(q);
const isRandomNonShopping = (q) =>
  /(what is coding|what is ai|what is javascript|who is|what is life|tell me a joke)/i.test(q.trim());
const isShoppingIntent = (q) =>
  /(show|find|buy|shop|casual|party|dress|shirt|hoodie|t-shirt|trousers|jeans|top|outfit|men's|women's|for men|for women)/i.test(q);

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
const getOrderReply = () =>
  "📦 Sure! Please provide your email ID so I can check your order details.";
const getFallbackReply = () =>
  "😊 I’m here to help you with clothing and outfit suggestions. Try asking things like *“show me men’s casual shirts”* or *“party wear for women”*.";

/* -------------------- MAIN FUNCTION -------------------- */
async function askGeminiFlash(query, products = [], categories = [], context = {}) {
  try {
    if (!query || !query.trim()) return null; // <-- return null if no query

    // Combine current query + previous user messages for multi-turn context
    const fullConversation = [
      query,
      ...(context.history?.map((h) => h.user) || []),
    ].join(" ");

    // 1️⃣ Handle simple intents
    if (isGreeting(fullConversation))
      return { resultType: "message", data: [{ type: "message", text: getGreetingReply() }] };
    if (isThankYou(fullConversation))
      return { resultType: "message", data: [{ type: "message", text: getThankYouReply() }] };
    if (isAboutSmartTry(fullConversation))
      return { resultType: "message", data: [{ type: "message", text: "🤖 I’m SmartTry AI — your fashion shopping assistant. I help you find the right clothes based on style, gender, price, and trends." }] };
    if (isConfusedFashionIntent(fullConversation))
      return { resultType: "message", data: [{ type: "message", text: "No worries 😊 Let’s figure it out together. Are you shopping for men or women, and is it for casual, office, or party wear?" }] };
    if (isOrderIntent(fullConversation))
      return { resultType: "message", data: [{ type: "message", text: getOrderReply() }] };
    if (isRandomNonShopping(fullConversation))
      return { resultType: "message", data: [{ type: "message", text: getFallbackReply() }] };
    if (!products.length || !isShoppingIntent(fullConversation)) return null; // <-- return null if no products

    // 2️⃣ Prepare products and history for Gemini
    const productList = products.slice(0, 20);
    const historyText = JSON.stringify(context.history?.map((h) => ({ user: h.user, ai: h.ai })) || []);

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `
You are **SmartTry AI**, a fashion-only ecommerce assistant.

IMPORTANT:
- Only recommend clothing products from the list below.
- Do NOT invent products.
- Return JSON array of 3-8 products or [] if none match.
- NEVER include text outside JSON.

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

USER HISTORY:
${historyText}

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

    let text = response?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    text = text.replace(/```json|```/g, "").trim();

    let selected;
    try {
      selected = JSON.parse(text);
    } catch {
      selected = [];
    }

    // 3️⃣ Map to real products + include reason
    const finalProducts =
      Array.isArray(selected) && selected.length
        ? selected
            .map((s) => {
              const product = productList.find((p) => p.name === s.name);
              if (!product) return null;
              return { ...product, reason: s.reason || "" };
            })
            .filter(Boolean)
        : [];

    // 4️⃣ If no valid product, return null to trigger manual fallback
    return finalProducts.length ? { resultType: "products", data: finalProducts } : null;
  } catch (err) {
    console.error("❌ Gemini Flash Error:", err.message);
    return null; // <-- smart null response
  }
}

module.exports = askGeminiFlash;
