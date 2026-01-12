const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function askGeminiFlash(
  query,
  products = [],
  categories = [],
  history = []
) {
  try {
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
    (p) =>
      `${p.name} | ${p.category} | ${p.price} | ${p.gender} | ${
        p.rating || 0
      } | ${p.discount || 0} | ${p.tags?.join(", ") || ""}`
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

    let text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";
    text = text
      .replace(/^```json/, "")
      .replace(/```$/, "")
      .trim();

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

module.exports = askGeminiFlash;