const productModel = require("../model/products");
const reviewsModel = require("../model/reviews");

const addReviews = async (req, res) => {
  try {
    const { productsId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    const product = await productModel.findById(productsId);
    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found with this Id : ", productsId });
    }
    const review = await reviewsModel.create({
      productsId: productsId,
      userId,
      rating,
      comment,
    });

    await review.save();
    res
      .status(201)
      .json({ message: "Review added successfully", review: review });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getReviewsByproductsId = async (req, res) => {
  try {
    const { productsId } = req.params;
    const reviews = await reviewsModel
      .find({ productsId: productsId })
      .populate("userId", "name email");
    res.status(200).json({ reviews });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
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
