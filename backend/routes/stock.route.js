const express = require("express");
const stockRouter = express.Router();
const { addStock, removeStock, getAllStocks } = require("../controllers/stocks");
const { authMiddleware, sellerMiddleware } = require("../middleware/authMiddleware");

stockRouter.patch("/add/:stockId", sellerMiddleware, addStock);
stockRouter.patch("/remove/:stockId",sellerMiddleware,removeStock)
stockRouter.get("/",sellerMiddleware,getAllStocks)

module.exports = stockRouter;