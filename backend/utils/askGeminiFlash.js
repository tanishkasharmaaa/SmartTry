const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function askGeminiFlash(
  query,
  products = [],
  categories = [],
  context = {}
) {
  try {
    const productList = products.slice(0, 15); // 🔥 reduce load

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `
You are SmartTry AI, an ecommerce product recommendation assistant.

RULES:
- Recommend ONLY from the products listed.
- NEVER invent products or categories.
- If nothing matches, return [].
- Output ONLY valid JSON.
- Max 3–8 products.

AVAILABLE CATEGORIES:
${categories.join(", ")}

PRODUCTS (name | category | price | gender | rating | tags):
${productList
  .map(
    (p) =>
      `${p.name} | ${p.category} | ${p.price} | ${p.gender || "Unisex"} | ${
        p.rating || 0
      } | ${p.tags?.join(", ") || ""}`
  )
  .join("\n")}

USER CONTEXT:
- Interests: ${context.userInterests?.join(", ") || "none"}
- Cart tags: ${context.cartTags?.join(", ") || "none"}
- Gender preference: ${context.gender || "any"}

USER QUERY:
"${query}"

RESPONSE FORMAT:
[
  {
    "name": "Exact product name",
    "category": "Category",
    "price": 1000,
    "gender": "Men/Women/Unisex",
    "rating": 0,
    "description": "Why this product matches the user"
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

    console.log(response)

    let text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // 🔥 Strong sanitization
    text = text
      .replace(/```json|```/g, "")
      .replace(/,\s*]/g, "]")
      .trim();

    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini Flash Error:", err.message);
    return []; // ✅ SAFE FALLBACK
  }
}

module.exports = askGeminiFlash;
