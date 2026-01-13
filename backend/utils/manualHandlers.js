const productModel = require("../model/products");
const orderModel = require("../model/order");
const User = require("../model/users");
const recommendProducts = require("./recommendProducts");

const handleManual = async ({ query, req }) => {
  const q = query.toLowerCase().trim();

  /* ================= SAFE GREETING ================= */
  if (/^(hello|hi|hey|greetings|good morning|good evening)$/i.test(q))
 {
    return {
      resultType: "message",
      data: [
        { type: "message", text: "👋 Hello! How can I assist you today?" },
      ],
    };
  }

  /* ================= SMARTTRY INTRO ================= */
  if (
    /\b(what is smarttry|about smarttry|who are you|what do you do)\b/i.test(q)
  ) {
    return {
      resultType: "message",
      data: [
        {
          type: "message",
          text: "🤖 I’m SmartTry AI — your personal shopping assistant. I help you discover products by category, price, gender, trends, and preferences.",
        },
      ],
    };
  }

  /* ================= ORDER TRACKING ================= */
  if (/\b(track my order|order status|where is my order)\b/i.test(q)) {
    const idMatch = query.match(/#?([a-f0-9]{8})/i);
    const shortId = idMatch?.[1];

    if (!shortId) {
      return {
        resultType: "message",
        data: [
          {
            type: "message",
            text: "📦 To track your order, just type something like: **Track my order #7f3a9c2d**",
          },
        ],
      };
    }

    const orders = await orderModel.find({ shortId }).lean();

    if (!orders.length) {
      return {
        resultType: "message",
        data: [{ type: "message", text: "❌ No order found with this ID." }],
      };
    }

    return {
      resultType: "order",
      data: orders.map((o) => ({
        type: "order",
        orderId: `#${o.shortId}`,
        status: o.orderStatus,
        items: o.items,
        totalAmount: o.totalAmount,
        realOrderId: o._id,
      })),
    };
  }

  /* ================= CATEGORIES ================= */
  if (/\b(categories|category|what do you sell)\b/i.test(q)) {
    const categories = await productModel.distinct("category");
    return { resultType: "categories", data: categories };
  }

  /* ================= GENDER ================= */
  const genders = [];
  if (/\b(men|male|boys|mens)\b/i.test(q)) genders.push("Men");
  if (/\b(women|female|girls|womens)\b/i.test(q)) genders.push("Women");
  if (/\b(unisex|both)\b/i.test(q)) genders.push("Unisex");

  /* ================= PRICE ================= */
  let priceFilter = {};
  const under = q.match(/under\s+(\d+)/i);
  if (under) priceFilter.$lte = Number(under[1]);

  const between = q.match(/between\s+(\d+)\s+and\s+(\d+)/i);
  if (between) {
    priceFilter.$gte = Number(between[1]);
    priceFilter.$lte = Number(between[2]);
  }

  /* ================= STYLE / TREND KEYWORDS ================= */
  const styleKeywords = [
    "baggy",
    "oversized",
    "loose",
    "streetwear",
    "trending",
    "trend",
    "fashion",
    "style",
    "modern",
    "casual",
  ];

  /* ================= OUTFIT / STYLE ================= */
  if (styleKeywords.some((k) => q.includes(k))) {
    const filter = {
      ...(genders.length && { gender: { $in: genders } }),
      ...(Object.keys(priceFilter).length && { price: priceFilter }),
      $or: [
        { tags: { $in: styleKeywords } },
        { name: { $regex: styleKeywords.join("|"), $options: "i" } },
        { category: { $regex: /fashion|clothing/i } },
      ],
    };

    const products = await productModel.find(filter).limit(20).lean();

    if (products.length) {
      return { resultType: "products", data: products };
    }
  }

  /* ================= BROWSE ================= */
  if (/\b(show|list|browse|find|see)\b/i.test(q)) {
    const filter = {
      ...(genders.length && { gender: { $in: genders } }),
      ...(Object.keys(priceFilter).length && { price: priceFilter }),
    };

    const products = await productModel.find(filter).limit(20).lean();

    if (products.length) {
      return { resultType: "products", data: products };
    }
  }

  /* ================= RECOMMEND ================= */
  if (/\b(recommend|suggest|best|popular|trending)\b/i.test(q)) {
    if (req.userId) {
      const results = await recommendProducts({
        userId: req.userId,
        limit: 10,
      });
      console.log(results,"------recommend results------")

      if (results.length) {
        return { resultType: "products", data: results };
      }
    }

    // fallback trending products
    const fallback = await productModel
      .find({})
      .sort({ rating: -1 })
      .limit(10)
      .lean();

    if (fallback.length) {
      return { resultType: "products", data: fallback };
    }
  }

  /* ================= KEYWORD SEARCH ================= */
  const greetingWords = ["hello","hi","hey","greetings"];
  const keywords = q.split(" ").filter(w => w.length > 2 && !greetingWords.includes(w));

  // Build filter
  const filter = {};
  if (genders.length) filter.gender = { $in: genders };
  if (Object.keys(priceFilter).length) filter.price = priceFilter;
  if (keywords.length) {
    filter.$or = [
      { name: { $regex: keywords.join("|"), $options: "i" } },
      { tags: { $regex: keywords.join("|"), $options: "i" } },
      { category: { $regex: keywords.join("|"), $options: "i" } },
    ];
  }

  const products = await productModel.find(filter).limit(20).lean();
  if (products.length) return { resultType: "products", data: products };


  /* ================= HARD STOP ================= */
  return null;
};

module.exports = handleManual;
