const productModel = require("../model/products");

/**
 * Recommend products based on:
 * - user interests
 * - cart product tags
 * - gender preference
 */
async function recommendProducts({
  userInterests = [],
  cartProductIds = [],
  gender = null,
  limit = 10,
}) {
  // Fetch cart products to extract tags
  const cartProducts = cartProductIds.length
    ? await productModel.find({ _id: { $in: cartProductIds } }).lean()
    : [];

  // Collect interest signals
  const interestTags = new Set([
    ...userInterests.map(i => i.toLowerCase()),
    ...cartProducts.flatMap(p => p.tags || []).map(t => t.toLowerCase()),
  ]);

  if (interestTags.size === 0) return [];

  // Base filter
  let filter = {
    tags: { $in: Array.from(interestTags) },
  };

  if (gender) {
    filter.gender = { $in: [gender, "Unisex"] };
  }

  // Fetch candidate products
  const products = await productModel.find(filter).lean();

  // Score products
  const scored = products.map(p => {
    let score = 0;

    // Tag match weight
    p.tags?.forEach(tag => {
      if (interestTags.has(tag.toLowerCase())) score += 3;
    });

    // Same category boost
    cartProducts.forEach(cp => {
      if (cp.category === p.category) score += 2;
    });

    // Rating boost
    score += (p.rating || 0);

    return { ...p, score };
  });

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

module.exports = recommendProducts;
