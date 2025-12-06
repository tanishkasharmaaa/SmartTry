const express = require("express");
const {
  getReviewsByproductsId,
  addReviews,
  deleteReview,
} = require("../controllers/reviews")
const { authMiddleware } = require("../middleware/authMiddleware");
const reviewsRouter = express.Router();

reviewsRouter.get("/", getReviewsByproductsId);
reviewsRouter.post("/add-review/:productsId", authMiddleware, addReviews);
reviewsRouter.delete("/delete-review/:reviewId", authMiddleware, deleteReview);

module.exports = reviewsRouter;
