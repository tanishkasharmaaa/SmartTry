const User = require("../model/users");
const Product = require("../model/products");
const Cart = require("../model/cart");
const Review = require("../model/reviews");

/**
 * Interest-based product recommendation
 * Interest MUST match product tags
 */
async function recommendProducts({ userId, limit = 10 }) {
  try {
    /* ================= USER ================= */
    const user = await User.findById(userId).lean();
    if (!user) return [];

    /* ================= NORMALIZE INTERESTS ================= */
    let interests = [];

    if (Array.isArray(user.interest)) {
      interests = user.interest.map((i) => i.toLowerCase().trim());
    } else if (typeof user.interest === "string") {
      interests = user.interest
        .toLowerCase()
        .split(/[ ,]+/)
        .filter((w) => w.length > 2);
    }

    // ❗ If user has no interests → skip matching
    const hasInterests = interests.length > 0;

    /* ================= CART ================= */
    const cart = await Cart.findOne({ userId }).lean();
    const cartProductIds =
      cart?.items?.map((i) => i.productsId.toString()) || [];

    /* ================= REVIEWS ================= */
    const reviewed = await Review.find({ userId }).select("productsId").lean();

    const reviewedProductIds = reviewed.map((r) => r.productsId.toString());

    /* ================= FETCH PRODUCTS ================= */
    let products = await Product.find({
      _id: { $nin: cartProductIds },
      gender: { $in: [user.gender, "Unisex"] },
    })
      .limit(200)
      .lean();

    /* ================= INTEREST MATCH FILTER ================= */
    if (hasInterests) {
      products = products.filter((product) => {
        const tags = (product.tags || []).map((t) => t.toLowerCase());
        return tags.some((tag) => interests.includes(tag));
      });
    }

    /* ================= FALLBACK ================= */
    if (!products.length) {
      console.log("⚠️ No interest match, falling back to top-rated products");

      products = await Product.find({})
        .sort({ rating: -1 })
        .limit(limit)
        .lean();
    }

    /* ================= SCORE & SORT ================= */
    const scoredProducts = products
      .map((product) => {
        let score = 0;

        const productId = product._id.toString();
        const tags = (product.tags || []).map((t) => t.toLowerCase());

        // Strong match
        if (tags.some((tag) => interests.includes(tag))) score += 5;

        // Ranking boosts
        if (reviewedProductIds.includes(productId)) score += 2;
        if (product.gender === user.gender) score += 1;
        if (product.rating >= 4) score += 1;
        if (product.discount >= 20) score += 1;

        return {
          id: product._id,
          name: product.name,
          price: product.price,
          category: product.category,
          gender: product.gender,
          image: product.image,
          rating: product.rating,
          discount: product.discount,
          tags: product.tags,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredProducts;
  } catch (err) {
    console.error("Recommendation error:", err);
    return [];
  }
}

module.exports = recommendProducts;
