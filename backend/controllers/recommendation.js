const User = require("../model/users")
const Product = require("../model/products")
const Cart = require("../model/cart")
const Review = require("../model/reviews")

const recommendations = async (req, res) => {
   try {
    const { userId } = req.params;

    // 1️⃣ Fetch user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const bioKeywords =
      user.bio?.toLowerCase().split(" ").filter(w => w.length > 3) || [];
    const interests = user.interest || [];

    // 2️⃣ Fetch cart items to exclude
    const cart = await Cart.findOne({ userId });
    const cartProductIds = cart?.items.map(i => i.productsId) || [];

    // 3️⃣ Fetch products the user has reviewed
    const reviewedProducts = await Review.find({ userId }).select("productsId");
    const reviewedProductIds = reviewedProducts.map(r => r.productsId);

    // 4️⃣ Build candidate products query
    const candidateProducts = await Product.find({
      _id: { $nin: cartProductIds }, // exclude cart
      gender: { $in: [user.gender, "Unisex"] }, // gender match
      $or: [
        { tags: { $in: interests } }, // match user interests
        { tags: { $in: bioKeywords } }, // match bio keywords
        { _id: { $in: reviewedProductIds } }, // products user reviewed
      ],
    }).limit(50);

    // 5️⃣ Score products
    const scoredProducts = candidateProducts
      .map(p => {
        let score = 0;

        // Strong signal: user reviewed similar product
        if (reviewedProductIds.includes(p._id)) score += 5;

        // Medium: interest match
        if (p.tags.some(tag => interests.includes(tag))) score += 3;

        // Weak: bio keyword match
        if (p.tags.some(tag => bioKeywords.includes(tag))) score += 2;

        // Gender match bonus
        if (p.gender === user.gender) score += 2;

        return { ...p._doc, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // top 10 recommendations

    res.json({
      success: true,
      recommendations: scoredProducts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {recommendations}