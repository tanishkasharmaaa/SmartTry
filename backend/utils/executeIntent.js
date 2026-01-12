const Product = require("../model/products");
const recommendProducts = require("./recommendProducts");

async function executeIntent(intentData, req) {
  switch (intentData.intent) {

    case "FILTER_PRICE": {
      const products = await Product.find({
        price: {
          $gte: intentData.min ?? 0,
          $lte: intentData.max ?? 100000,
        },
      })
        .limit(12)
        .lean();

      return products.length
        ? { type: "products", data: products }
        : null;
    }

    case "RECOMMEND": {
      if (!req.userId) return null;

      const products = await recommendProducts({
        userId: req.userId,
        limit: 10,
      });

      return products.length
        ? { type: "products", data: products }
        : null;
    }

    case "GREETING":
      return {
        type: "message",
        data: [
          {
            type: "message",
            text: "👋 Hi! What are you shopping for today?",
          },
        ],
      };

    default:
      return null;
  }
}

module.exports = executeIntent;
