// controllers/askAI.js
const { GoogleGenAI } = require("@google/genai");
const productModel = require("../model/products");
const orderModel = require("../model/order");
const recommendProducts = require("./recommendProducts");
const askGeminiFlash = require("./askGeminiFlash");
const parseIntent = require("./parseUserIntent");

const User = require("../model/users");
require("dotenv").config();

/* ======================================================
   MAIN CONTROLLER
====================================================== */
const askAI = async (req, res, ws = null, conversationHistory = []) => {
  try {
    const { query } = req.body;
    if (!query) {
      if (ws?.readyState === 1) {
        ws.send(
          JSON.stringify({
            type: "aiError",
            message: "Query required",
          })
        );
        return;
      }
      return res.status(400).json({ message: "Query required" });
    }

    const q = query.toLowerCase();

    const intentData = await parseIntent(q);
    console.log("🧠 Intent:", intentData);

    /* ---------------- FETCH DATA ---------------- */
    const categories = await productModel.distinct("category");
    const allProducts = await productModel.find({}).limit(20).lean();

    /* ======================================================
       SMARTTRY INTRO (MANUAL)
    ====================================================== */
    if (/what is smarttry|about smarttry|who are you|what do you do/i.test(q)) {
      const data = [
        {
          type: "message",
          text: "🤖 I’m SmartTry AI — your personal shopping assistant. I help you find products by category, price, gender, trends, and your preferences.",
        },
      ];

      if (ws?.readyState === 1) {
        ws.send(
          JSON.stringify({ type: "aiMessage", resultType: "message", data })
        );
        ws.send(JSON.stringify({ type: "aiEnd" }));
        return;
      }

      return res.json({ success: true, type: "message", data });
    }

    /* ======================================================
       GREEETING (MANUAL)
    ====================================================== */

    if (
      /hello|hi|hey|greetings|good morning|good afternoon|good evening/i.test(q)
    ) {
      const data = [
        {
          type: "message",
          text: "👋 Hello! How can I assist you with your shopping today?",
        },
      ];
      if (ws?.readyState === 1) {
        ws.send(
          JSON.stringify({ type: "aiMessage", resultType: "message", data })
        );
        ws.send(JSON.stringify({ type: "aiEnd" }));
        return;
      }
      return res.json({ success: true, type: "message", data });
    }

    /* ======================================================
       SMARTTRY INTRO (MANUAL)
    ====================================================== */

    if (
      /track my order status|where is my order|order status|track order/i.test(
        q
      )
    ) {
      const idMatch = query.match(/#?([a-f0-9]{8})/i);
      const shortId = idMatch ? idMatch[1] : null;

      if (!shortId) {
        const data = [
          {
            type: "message",
            text: "📦 Please provide your Order ID (example: #7f3a9c2d).",
          },
        ];

        if (ws?.readyState === 1) {
          ws.send(
            JSON.stringify({ type: "aiMessage", resultType: "message", data })
          );
          ws.send(JSON.stringify({ type: "aiEnd" }));
          return;
        }

        return res.json({ success: true, type: "message", data });
      }

      const orders = await orderModel.find({ shortId }).lean();
      console.log(orders, shortId);
      const data = orders.length
        ? orders.map((order) => ({
            type: "order",
            orderId: `#${order.shortId}`,
            status: order.orderStatus,
            items: order.items,
            totalAmount: order.totalAmount,
          }))
        : [
            {
              type: "message",
              text: "❌ No order found with this Order ID.",
            },
          ];
      console.log(orders[0].items);

      if (ws?.readyState === 1) {
        ws.send(
          JSON.stringify({ type: "aiMessage", resultType: "order", data })
        );
        ws.send(JSON.stringify({ type: "aiEnd" }));
        return;
      }

      return res.json({ success: true, type: "orderStatus", data });
    }

    /* ======================================================
       CATEGORY LIST (MANUAL)
    ====================================================== */
    if (/category|categories|what do you sell|what products/i.test(q)) {
      console.log(categories);
      if (ws?.readyState === 1) {
        ws.send(
          JSON.stringify({
            type: "aiMessage",
            resultType: "categories",
            data: categories,
          })
        );

        ws.send(JSON.stringify({ type: "aiEnd" }));
        return;
      }

      return res.json({ success: true, type: "categories", data: categories });
    }

    /* ======================================================
       GENDER DETECTION
    ====================================================== */
    const genders = [];
    if (/(men|mens|boys|male|man|males)/i.test(q)) genders.push("Men");
    if (/(women|womens|girls|ladies|female|woman|females)/i.test(q))
      genders.push("Women");
    if (/unisex|both/i.test(q)) genders.push("Unisex");
    /* ======================================================
   PRICE DETECTION
====================================================== */
    let priceFilter = {};
    const underMatch = q.match(/under\s+(\d+)/i);
    if (underMatch) priceFilter.$lte = Number(underMatch[1]);

    const betweenMatch = q.match(/between\s+(\d+)\s+and\s+(\d+)/i);
    if (betweenMatch) {
      priceFilter.$gte = Number(betweenMatch[1]);
      priceFilter.$lte = Number(betweenMatch[2]);
    }

    /* ======================================================
   OUTFIT / CLOTHING INTENT
====================================================== */
    const outfitKeywords = [
      "outfit",
      "outfits",
      "clothing",
      "dress",
      "top",
      "kurti",
      "shirt",
      "jeans",
      "fashion",
    ];
    const isOutfitQuery = outfitKeywords.some((k) => q.includes(k));

    /* ======================================================
   1️⃣ OUTFIT QUERY (WITH PRICE / GENDER)
====================================================== */
    if (isOutfitQuery) {
      let filter = {};

      if (genders.length) filter.gender = { $in: genders };
      if (Object.keys(priceFilter).length) filter.price = priceFilter;

      filter.$or = [
        { category: { $regex: /clothing|fashion|outfit/i } },
        { tags: { $in: outfitKeywords } },
      ];

      const products = await productModel.find(filter).lean();

      const formatted = products.map((p) => ({
        name: p.name,
        price: p.price,
        category: p.category,
        gender: p.gender,
        image: p.image,
        rating: p.rating,
        discount: p.discount,
        id: p._id,
      }));

      if (ws?.readyState === 1) {
        ws.send(
          JSON.stringify({
            type: "aiMessage",
            resultType: "products",
            data: formatted,
          })
        );
        ws.send(JSON.stringify({ type: "aiEnd" }));
        return;
      }

      return res.json({
        success: true,
        type: "products",
        data: formatted,
      });
    }

    /* ======================================================
   2️⃣ PRICE-ONLY QUERY (NO OUTFIT)
====================================================== */
    if (!isOutfitQuery && Object.keys(priceFilter).length) {
      const products = await productModel
        .find({ price: priceFilter })
        .limit(20)
        .lean();

      const formatted = products.map((p) => ({
        name: p.name,
        price: p.price,
        category: p.category,
        image: p.image,
        rating: p.rating,
        discount: p.discount,
        id: p._id,
      }));

      if (ws?.readyState === 1) {
        ws.send(
          JSON.stringify({
            type: "aiMessage",
            resultType: "products",
            data: formatted,
          })
        );
        ws.send(JSON.stringify({ type: "aiEnd" }));
        return;
      }

      return res.json({
        success: true,
        type: "products",
        data: formatted,
      });
    }

    /* ======================================================
   BROWSE / SHOW PRODUCTS (MEN / WOMEN)
====================================================== */

    const isBrowseIntent =
      /(show|list|display|find|see|browse|products|items)/i.test(q);

    if (isBrowseIntent && genders.length) {
      let filter = {
        gender: { $in: genders },
      };

      if (Object.keys(priceFilter).length) {
        filter.price = priceFilter;
      }

      const products = await productModel.find(filter).limit(20).lean();

      if (products.length) {
        if (ws?.readyState === 1) {
          ws.send(
            JSON.stringify({
              type: "aiMessage",
              resultType: "products",
              data: products,
            })
          );
          ws.send(JSON.stringify({ type: "aiEnd" }));
          return;
        }

        return res.json({
          success: true,
          type: "products",
          data: products,
        });
      }
    }

    

    /* ======================================================
       MANUAL RECOMMENDATIONS
    ====================================================== */

    const isRecommendIntent =
      /recommend|suggest|best|top|trending|popular|for me|what should i/i.test(
        q
      );

    if (isRecommendIntent) {
      let manualResults = [];
      let user = null;

      // HTTP request
      if (req.user) {
        user = req.user;
      }

      // WebSocket request
      if (!user && req.userId) {
        user = await User.findById(req.userId).lean();
      }

      console.log("User for recommendation:", user);
      console.log("UserId:", req.userId);

      if (req.userId) {
        manualResults = await recommendProducts({
          userId: req.userId, // ✅ FIXED
          limit: 10,
        });
      }

      const responsePayload = {
        type: "aiMessage",
        resultType: manualResults.length ? "products" : "message",
        data: manualResults.length
          ? manualResults
          : [
              {
                type: "message",
                text: "✨ I need more activity to recommend better products. Try browsing or adding items to cart.",
              },
            ],
      };

      if (ws?.readyState === 1) {
        ws.send(JSON.stringify(responsePayload));
        ws.send(JSON.stringify({ type: "aiEnd" }));
        return;
      }

      return res.json({
        success: true,
        type: responsePayload.resultType,
        data: responsePayload.data,
      });
    }

    /* ======================================================
       KEYWORD SEARCH (MANUAL)
    ====================================================== */
    const keywords = q.split(" ").filter((w) => w.length > 2);
    if (keywords.length) {
      let filter = {
        $or: [
          { name: { $regex: keywords.join("|"), $options: "i" } },
          { tags: { $regex: outfitKeywords.join("|"), $options: "i" } },
        ],
      };

      if (genders.length) filter.gender = { $in: genders };
      if (Object.keys(priceFilter).length) filter.price = priceFilter;

      const products = await productModel.find(filter).lean();

      if (products.length) {
        if (ws?.readyState === 1) {
          ws.send(
            JSON.stringify({
              type: "aiMessage",
              resultType: "products",
              data: products,
            })
          );
          ws.send(JSON.stringify({ type: "aiEnd" }));
          return;
        }

        return res.json({
          success: true,
          type: "products",
          data: products,
        });
      }
    }

    /* ======================================================
       AI FIRST (PRIMARY)
    ====================================================== */
    const aiResponse = await askGeminiFlash(
      query,
      allProducts.slice(0, 20),
      categories,
      conversationHistory
    );

    if (Array.isArray(aiResponse) && aiResponse.length) {
      if (ws?.readyState === 1) {
        ws.send(JSON.stringify({
          type: "aiMessage",
          resultType: "products",
          data: aiResponse,
        }));
        ws.send(JSON.stringify({ type: "aiEnd" }));
        return;
      }

      return res.json({
        success: true,
        type: "products",
        data: aiResponse,
      });
    }

    /* ======================================================
       FINAL FALLBACK
    ====================================================== */


    if (ws?.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: "aiMessage",
          resultType: "message",
          data: [
            {
              type: "message",
              text: "🤔 I couldn’t find matching products. Try:\n• Girls outfits under 3000\n• Best shoes for men\n• Trending products",
            },
          ],
        })
      );
      ws.send(JSON.stringify({ type: "aiEnd" }));
      return;
    }

    return res.json({
      success: true,
      type: "message",
      data: [
        {
          type: "message",
          text: "🤔 I couldn’t find matching products. Try:\n• Girls outfits under 3000\n• Best shoes for men\n• Trending products",
        },
      ],
    });
  } catch (err) {
    console.error("ASK AI ERROR:", err);

    if (ws?.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: "aiError",
          message: err.message,
        })
      );
      return;
    }

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = askAI;
