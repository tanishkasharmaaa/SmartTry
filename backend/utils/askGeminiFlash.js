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
    if (!products.length) {
      return null;
    }

    const productList = products.slice(0, 20);

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `
You are SmartTry AI, an ecommerce product selector.

STRICT RULES (VERY IMPORTANT):
- Use ONLY products from the list below
- NEVER invent new products
- NEVER change product names
- NEVER return explanations outside JSON
- If nothing matches, return []
- Select 3–8 best matching products

TASK:
Match the USER QUERY with the most relevant products.

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
- Cart tags: ${context.cartTags?.join(", ") || "none"}
- Preferred gender: ${context.gender || "any"}

USER QUERY:
"${query}"

RESPONSE FORMAT (ONLY JSON):
[
  {
    "name": "Exact product name from list",
    "reason": "short reason why it matches"
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

    // 🧼 Strong sanitization
    text = text.replace(/```json|```/g, "").trim();

    const selected = JSON.parse(text);

    if (!Array.isArray(selected) || selected.length === 0) {
      return null;
    }

    // 🔗 Map Gemini output → real DB products
    const selectedNames = selected.map((s) => s.name);

    const finalProducts = productList.filter((p) =>
      selectedNames.includes(p.name)
    );

    if (!finalProducts.length) return null;

    // ✅ SAME FORMAT AS handleManual
    return {
      resultType: "products",
      data: finalProducts,
    };
  } catch (err) {
    console.error("❌ Gemini Flash Error:", err.message);
    return null; // fallback to manual
  }
}

module.exports = askGeminiFlash;
