const mongoose = require("mongoose");
const stockModel = require("../model/stocks");
const productModel = require("../model/products");

const addStock = async (req,res) => {
    try {
        const {stockId} = req.params;
        const {size, stock, reason} = req.body;
        const stockEntry = await stockModel.findById(stockId)
        if(!stockEntry){
            return res.status(404).json({message:"Stock entry not found for the given product"})
        }
        const prev = stockEntry.currentStock[size] || 0;
        stockEntry.currentStock[size] = stockEntry.currentStock[size]+stock;
        stockEntry.updatedStocks.push({
            size,
            previousStock:prev,
            newStock:stockEntry.currentStock[size],
            changeType:"ADD",
            reason:reason||"Stock added"
        })
        await stockEntry.save();
        res.status(200).json({message:"Stock added successfully",stockEntry})

    } catch (error){ 
        console.log(error);
        res.status(500).json({message:"Internal sever error"})
    }
}

const removeStock = async (req,res) => {
    try {
        const {stockId} = req.params;
        const {size, stock, reason} = req.body;
        const stockEntry = await stockModel.findById(stockId)
        if(!stockEntry){
            res.status(400).json({message:"Stock entry not found for the given product"})
        }
        const prev = stockEntry.currentStock[size] || 0;
        const newStock = Math.max(prev - Number(stock), 0);
        stockEntry.currentStock[size] = newStock
        stockEntry.updatedStocks.push({
            size,
            previousStock:prev,
            newStock,
            changeType:"REMOVE",
            reason:reason||"Stock removed",
        })
        await stockEntry.save();
        res.status(200).json({message:"Stock removed successfully",stockEntry})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Internal sever error"})
    }
}

const getAllStocks = async(req,res) => {
    try {
        const {userId} = req.user
        const stocks = await stockModel.find({sellerId:userId})
        if(!stocks){
            return res.status(400).json({message:"Stock not found"})
        }
        res.status(200).json({message:"Stocks uccessfully fetched",stocks})
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"Internal server error"})
    }
}

module.exports = {addStock, removeStock, getAllStocks}