const productModel = require("../models/products");
const rulesModel = require("../model/rules")
// --------------------------------------------------------
// 1️⃣ Get All Categories
// --------------------------------------------------------
const getCategories = async (req, res) => {
  try {
    // Fetch all categories only
    const categories = await productModel.distinct("category");

    res.status(200).json({
      message: "Categories fetched successfully",
      categories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --------------------------------------------------------
// 2️⃣ Best Quality Products
//     (Assuming you have a `rating` field: 1–5 stars)
// --------------------------------------------------------
const getBestQualityProducts = async (req, res) => {
  try {
    const products = await productModel
      .find()
      .sort({ rating: -1 })
      .limit(20);

    res.status(200).json({
      message: "Best quality products fetched successfully",
      products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --------------------------------------------------------
// 3️⃣ Top Selling Products
//     (Assuming you have `soldCount` field)
// --------------------------------------------------------
const getTopSellingProducts = async (req, res) => {
  try {
    const products = await productModel
      .find()
      .sort({ soldCount: -1 })
      .limit(20);

    res.status(200).json({
      message: "Top-selling products fetched successfully",
      products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// --------------------------------------------------------
// 5️⃣ Get Product Details
// --------------------------------------------------------
const getProductDetails = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await productModel
      .findById(productId)
      .populate("categoryId");

    if (!product)
      return res.status(404).json({ message: "Product not found" });

    res.status(200).json({
      message: "Product details fetched successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --------------------------------------------------------
// 6️⃣ Search Products (name, brand, category, description)
// --------------------------------------------------------
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    const products = await productModel.find({
      $or: [
        { name: new RegExp(q, "i") },
        { brand: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
      ],
    });

    res.status(200).json({
      message: "Search results",
      products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  getBestQualityProducts,
  getTopSellingProducts,
  getProductDetails,
  searchProducts,
};
