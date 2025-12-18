const User = require("../model/users");
const Product = require("../model/products");
const Cart = require("../model/cart");
const Review = require("../model/reviews");

const recommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    /* ================= USER ================= */
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    /* ================= NORMALIZE INTERESTS ================= */
    let interests = [];

    if (Array.isArray(user.interest)) {
      interests = user.interest.map(i => i.toLowerCase().trim());
    } else if (typeof user.interest === "string") {
      interests = user.interest
        .toLowerCase()
        .split(/[ ,]+/)
        .filter(w => w.length > 2);
    }
    

    /* ================= BIO KEYWORDS ================= */
    const bioKeywords =
      user.bio
        ?.toLowerCase()
        .split(/[ ,]+/)
        .filter(w => w.length > 3) || [];

    /* ================= CART EXCLUSION ================= */
    const cart = await Cart.findOne({ userId }).lean();
    const cartProductIds =
      cart?.items?.map(i => i.productsId.toString()) || [];

    /* ================= REVIEWS ================= */
    const reviewed = await Review.find({ userId })
      .select("productsId")
      .lean();

    const reviewedProductIds = reviewed.map(r =>
      r.productsId.toString()
    );

    /* ================= FETCH PRODUCTS ================= */
    const products = await Product.find({
      _id: { $nin: cartProductIds },
      gender: { $in: [user.gender, "Unisex"] },
    })
      .limit(100)
      .lean();

    /* ================= SCORE PRODUCTS ================= */
    const scoredProducts = products
      .map(product => {
        let score = 0;

        const productId = product._id.toString();
        const tags = (product.tags || []).map(t =>
          t.toLowerCase()
        );

        // ⭐ Strong signal: reviewed before
        if (reviewedProductIds.includes(productId)) {
          score += 5;
        }

        // ⭐ Medium: interest match
        if (tags.some(tag => interests.includes(tag))) {
          score += 3;
        }

        // ⭐ Weak: bio keyword match
        if (tags.some(tag => bioKeywords.includes(tag))) {
          score += 2;
        }

        // ⭐ Gender match
        if (product.gender === user.gender) {
          score += 2;
        }

        return { ...product, score };
      })
      .filter(p => p.score > 0) // remove irrelevant items
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    /* ================= RESPONSE ================= */
    res.json({
      success: true,
      count: scoredProducts.length,
      recommendations: scoredProducts,
    });
  } catch (err) {
    console.error("Recommendation error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { recommendations };
