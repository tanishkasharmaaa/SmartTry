const productModel = require("../model/products");
const stockModel = require("../model/stocks");
const redis = require("../config/redis");

const createProducts = async (req, res) => {
  try {
    const { name, description, price, category, gender, size, stock, image } =
      req.body;
    const { userId, name: sellerName } = req.user;

    // 🟢 1️⃣ Create product (without stockId)
    const productData = await productModel.create({
      name,
      description,
      price,
      category,
      gender,
      size,
      image,
      sellerId: userId,
      sellerName,
      stockId: null,
    });

    // 🟢 2️⃣ Create stock entry linked to the product
    const stockData = await stockModel.create({
      productsId: productData._id, // ✅ Correct field name
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

    // 🟢 3️⃣ Link the created stock with the product
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

const updateProducts = async (req, res) => {
  try {
    const productsId = req.params.productsId;
    const body = req.body;

    // Find product
    const product = await productModel.findById(productsId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update product fields
    const fields = [
      "name",
      "description",
      "price",
      "category",
      "image",
      "gender",
      "size",
    ];

    fields.forEach((field) => {
      if (body[field]) product[field] = body[field];
    });

    await product.save();

    // 🧩 Update stock if stock info provided
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
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteProducts = async (req, res) => {
  try {
    const productsId = req.params.productsId;
    const deletedProduct = await productModel.findByIdAndDelete(productsId);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    await stockModel.deleteOne({ productsId });

    res
      .status(200)
      .json({ message: "Product and related stock deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (brand) query.brand = brand;

    // Case insensitive gender (Men, men, MEN)
    if (gender) {
      query.gender = { $regex: `^${gender}$`, $options: "i" };
    }

    if (size) {
      query.size = size;
      query[`currentStock.${size}`] = { $gt: 0 };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    // ------------------------------------------
    // 🔥 REDIS CACHE KEY (unique to this request)
    // ------------------------------------------
    const cacheKey = `products:${JSON.stringify(req.query)}`;

    // ------------------------------------------
    // 🔥 Try reading from Redis
    // ------------------------------------------
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      console.log("⚡ Redis Cache Hit");

      return res.status(200).json({
        ...JSON.parse(cachedData),
        fromCache: true,
      });
    }

    console.log("⏳ Redis Cache Miss");

    // ------------------------------------------
    // DB CALLS
    // ------------------------------------------
    const totalProducts = await productModel.countDocuments(query);

    const products = await productModel
      .find(query)
      .populate("stockId")
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalpages = Math.ceil(totalProducts / Number(limit));

    const response = {
      message: "✅ Products fetched successfully",
      products,
      totalProducts,
      totalpages,
      page: Number(page),
      limit: Number(limit),
    };

    // ------------------------------------------
    // 🔥 SAVE RESPONSE IN REDIS FOR 10 MINUTES
    // ------------------------------------------
    await redis.set(cacheKey, JSON.stringify(response), "EX", 60 * 10);

    return res.status(200).json(response);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createProducts,
  updateProducts,
  deleteProducts,
  fetchProducts,
};
