const express = require("express");
const productRouter = express.Router();
const {
  createProducts,
  updateProducts,
  deleteProducts,
  fetchProducts,
  fetchByPage,
} = require("../controllers/products");
const {
  authMiddleware,
  sellerMiddleware,
} = require("../middleware/authMiddleware");

productRouter.post("/create", sellerMiddleware, createProducts);
productRouter.put("/update/:productsId", sellerMiddleware, updateProducts);
productRouter.delete("/delete/:productsId", sellerMiddleware, deleteProducts);
productRouter.get("/paginated", fetchProducts);

module.exports = productRouter;
