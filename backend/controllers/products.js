const productModel = require("../model/products");
const stockModel = require("../model/stocks");
const redis = require("../config/redis");
const mongoose = require("mongoose");

/* ======================================================
   CREATE PRODUCT
====================================================== */
const createProducts = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      gender,
      size,
      stock,
      image,
      tags,
    } = req.body;

    const { userId, name: sellerName } = req.user;

    // ✅ Normalize tags
    const normalizedTags = Array.isArray(tags)
      ? [...new Set(tags.map((t) => t.toLowerCase().trim()))]
      : [];

    // 🟢 Create product
    const productData = await productModel.create({
      name,
      description,
      price,
      category,
      gender,
      size,
      image,
      tags: normalizedTags, // ✅ TAGS ADDED
      sellerId: userId,
      sellerName,
      stockId: null,
      reviewsId: [],
    });

    // 🟢 Create stock entry
    const stockData = await stockModel.create({
      productsId: productData._id,
      sellerId: userId,
      currentStock: {
        S: size === "S" ? stock : 0,
        M: size === "M" ? stock : 0,
        L: size === "L" ? stock : 0,
        XL: size === "XL" ? stock : 0,
        XXL: size === "XXL" ? stock : 0,
        FreeSize: size === "Free Size" ? stock : 0,
      },
      updatedStocks: [
        {
          size: size || "FreeSize",
          previousStock: 0,
          newStock: stock || 0,
          changeType: "ADD",
          reason: "Initial stock added",
        },
      ],
    });

    // 🟢 Link stock
    productData.stockId = stockData._id;
    await productData.save();

    res.status(201).json({
      message: "✅ Product and stock created successfully",
      product: productData,
      stock: stockData,
    });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ======================================================
   UPDATE PRODUCT
====================================================== */
const updateProducts = async (req, res) => {
  try {
    const { productsId } = req.params;
    const body = req.body;

    const product = await productModel.findById(productsId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const fields = [
      "name",
      "description",
      "price",
      "category",
      "image",
      "gender",
      "size",
      "tags", // ✅ ADD TAGS
    ];

    fields.forEach((field) => {
      if (body[field]) {
        if (field === "tags" && Array.isArray(body.tags)) {
          product.tags = [
            ...new Set(body.tags.map((t) => t.toLowerCase().trim())),
          ];
        } else {
          product[field] = body[field];
        }
      }
    });

    await product.save();

    // 🧩 Update stock if required
    if (body.size && body.stock !== undefined) {
      const stock = await stockModel.findOne({ productsId });
      if (stock) {
        const prev = stock.currentStock[body.size] || 0;
        stock.currentStock[body.size] = body.stock;

        stock.updatedStocks.push({
          size: body.size,
          previousStock: prev,
          newStock: body.stock,
          changeType: "UPDATE",
          reason: "Manual stock update",
        });

        await stock.save();
      }
    }

    res.status(200).json({
      message: "✅ Product updated successfully",
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ======================================================
   DELETE PRODUCT
====================================================== */
const deleteProducts = async (req, res) => {
  try {
    const { productsId } = req.params;

    const deletedProduct = await productModel.findByIdAndDelete(productsId);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    await stockModel.deleteOne({ productsId });

    res.status(200).json({
      message: "✅ Product and related stock deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ======================================================
   FETCH PRODUCTS (WITH TAG FILTER)
====================================================== */
const fetchProducts = async (req, res) => {
  try {
    const {
      category,
      brand,
      size,
      search,
      minPrice,
      maxPrice,
      gender,
      tags, // ✅ TAG FILTER
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (brand) query.brand = brand;

    if (gender) {
      query.gender = { $regex: `^${gender}$`, $options: "i" };
    }

    if (tags) {
      const tagArray = tags.split(",").map((t) => t.toLowerCase().trim());
      query.tags = { $in: tagArray };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(search);

      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];

      if (isValidObjectId) {
        query.$or.push({ _id: search });
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const cacheKey = `products:${JSON.stringify(req.query)}`;

    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        ...JSON.parse(cachedData),
        fromCache: true,
      });
    }

    const totalProducts = await productModel.countDocuments(query);

    const products = await productModel
      .find(query)
      .populate("stockId")
      .populate("sellerId", "name email image")
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const response = {
      message: "✅ Products fetched successfully",
      products,
      totalProducts,
      totalpages: Math.ceil(totalProducts / Number(limit)),
      page: Number(page),
      limit: Number(limit),
    };

    await redis.set(cacheKey, JSON.stringify(response), "EX", 600);

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createProducts,
  updateProducts,
  deleteProducts,
  fetchProducts,
};
