const productModel = require("../model/products");
const reviewsModel = require("../model/reviews");

const addReviews = async (req, res) => {
  try {
    const { productsId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    // 1️⃣ Validate product
    const product = await productModel.findById(productsId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 2️⃣ Prevent duplicate review
    const alreadyReviewed = await reviewsModel.findOne({
      productsId,
      userId,
    });

    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    // 3️⃣ Create review
    const review = await reviewsModel.create({
      productsId,
      userId,
      rating,
      comment,
    });

    // 4️⃣ Recalculate rating stats
    const stats = await reviewsModel.aggregate([
      { $match: { productsId: product._id } },
      {
        $group: {
          _id: "$productsId",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    // 5️⃣ Update product with stats + reviewId
    await productModel.findByIdAndUpdate(productsId, {
      $push: { reviewsId: review._id },
      averageRating: stats[0]?.avgRating || 0,
      totalReviews: stats[0]?.totalReviews || 0,
    });

    res.status(201).json({
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const getReviewsByproductsId = async (req, res) => {
  try {
    const { productsId } = req.params;

    // 1️⃣ Validate product existence (important)
    const productExists = await productModel.exists({ _id: productsId });
    if (!productExists) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // 2️⃣ Fetch reviews
    const reviews = await reviewsModel
      .find({ productsId })
      .populate({
        path: "userId",
        select: "name email",
      })
      .sort({ createdAt: -1 }) // latest first
      .lean();

    res.status(200).json({
      message: "Reviews fetched successfully",
      totalReviews: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await reviewsModel.findByIdAndDelete(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { addReviews, getReviewsByproductsId, deleteReview };
