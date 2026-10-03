const productModel = require("../model/products");
const orderModel = require("../model/order");
const recommendProducts = require("./recommendProducts");

// Helper to safely escape regex special characters
const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

const handleManual = async ({ query, req }) => {
  const q = query.toLowerCase().trim();
  console.log("Manual Query:", q);

  /* ================= SAFE GREETING ================= */
  if (/^(hello|hi|hey|greetings|good morning|good evening)$/i.test(q)) {
    return {
      resultType: "message",
      data: [{ type: "message", text: "👋 Hello! How can I assist you today?" }],
    };
  }

  /* ================= SMARTTRY INTRO ================= */
  if (/\b(what is smarttry|about smarttry|who are you|what do you do)\b/i.test(q)) {
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
  let sortOption = {};

  // under / below / less than
  const under = q.match(/(under|below|less than)\s+(\d+)/i);
  if (under) priceFilter.$lte = Number(under[2]);

  // between 500 and 1000 / between 500 to 1000
  const between = q.match(/between\s+(\d+)\s+(and|to)\s+(\d+)/i);
  if (between) {
    priceFilter.$gte = Number(between[1]);
    priceFilter.$lte = Number(between[3]);
  }

  // range 500 to 1000
  const range = q.match(/range\s+(\d+)\s+to\s+(\d+)/i);
  if (range) {
    priceFilter.$gte = Number(range[1]);
    priceFilter.$lte = Number(range[2]);
  }

  // cheapest / expensive
  const isCheapest = /(cheapest|lowest price|budget)/i.test(q);
  const isExpensive = /(most expensive|highest price|premium)/i.test(q);

  if (isCheapest) sortOption.price = 1;
  if (isExpensive) sortOption.price = -1;

  /* ================= STYLE ================= */
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

  const hasStyle = styleKeywords.some((k) => q.includes(k));
  const hasPrice = Object.keys(priceFilter).length > 0 || isCheapest || isExpensive;

  if (hasStyle || hasPrice) {
    const filter = {
      ...(genders.length && { gender: { $in: genders } }),
      ...(Object.keys(priceFilter).length && { price: priceFilter }),
    };

    if (hasStyle) {
      filter.$or = [
        { tags: { $in: styleKeywords } },
        { name: { $regex: styleKeywords.join("|"), $options: "i" } },
        { category: { $regex: /fashion|clothing/i } },
      ];
    }

    const products = await productModel
      .find(filter)
      .sort(sortOption)
      .limit(20)
      .lean();

    if (products.length) {
      return { resultType: "products", data: products };
    }

    return {
      resultType: "message",
      data: [
        {
          type: "message",
          text: "😕 No products found. Try adjusting price, gender, or style.",
        },
      ],
    };
  }

  /* ================= RECOMMENDATIONS ================= */
  if (/\b(recommend|suggest|best|popular|trending|recommendations|recommendation)\b/i.test(q)) {
    if (req?.userId) {
      const results = await recommendProducts({
        userId: req.userId,
        limit: 10,
      });

      if (results.length) {
        return { resultType: "products", data: results };
      }
    }

    // Fallback to top-rated trending products
    const fallback = await productModel
      .find({})
      .sort({ rating: -1 })
      .limit(10)
      .lean();

    if (fallback.length) {
      return { resultType: "products", data: fallback };
    }
  }

  /* ================= GENERAL KEYWORD SEARCH ================= */
  const ignoreWords = [
    "show", "list", "browse", "find", "see", "for", "under", "below",
    "between", "to", "and", "hello", "hi", "hey", "greetings", "me", "products"
  ];

  const searchKeywords = q
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/gi, ""))
    .filter((w) => w.length > 2 && !ignoreWords.includes(w));

  const filter = {};
  if (genders.length) filter.gender = { $in: genders };
  if (Object.keys(priceFilter).length) filter.price = priceFilter;

  if (searchKeywords.length) {
    const regexPattern = searchKeywords.map(escapeRegex).join("|");
    filter.$or = [
      { name: { $regex: regexPattern, $options: "i" } },
      { tags: { $regex: regexPattern, $options: "i" } },
      { category: { $regex: regexPattern, $options: "i" } },
    ];
  }

  const products = await productModel.find(filter).limit(20).lean();

  if (products.length) {
    return { resultType: "products", data: products };
  }

  /* ================= HARD STOP ================= */
  return null;
};

module.exports = handleManual;