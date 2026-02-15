async function retrieveRelevantProducts(ProductModel, query, limit = 30) {
  if (!query || !query.trim()) return [];

  const results = await ProductModel.aggregate([
    {
      $match: {
        $text: { $search: query }
      }
    },
    {
      $addFields: {
        score: { $meta: "textScore" }
      }
    },
    {
      $sort: {
        score: -1,
        rating: -1
      }
    },
    {
      $limit: limit
    },
    {
      $project: {
        name: 1,
        category: 1,
        price: 1,
        gender: 1,
        rating: 1,
        tags: 1,
        image:1
      }
    }
  ]);

  return results;
}

module.exports = retrieveRelevantProducts;
