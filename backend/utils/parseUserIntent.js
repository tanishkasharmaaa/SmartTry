const askGeminiFlash = require("./askGeminiFlash");

async function parseIntent(q) {
  const prompt = `
You are an intent classifier for an ecommerce app.

Return ONLY valid JSON.

Possible intents:
- RECOMMEND
- FILTER_PRICE
- GREETING
- UNKNOWN

Example:
{
  "intent": "FILTER_PRICE",
  "min": 500,
  "max": 1000
}

User query:
"${q}"
`;

  try {
    const raw = await askGeminiFlash(prompt);
    return JSON.parse(raw);
  } catch {
    return { intent: "UNKNOWN" };
  }
}

module.exports = parseIntent;
