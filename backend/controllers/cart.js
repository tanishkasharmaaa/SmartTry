const cartModel = require("../model/cart");
const productModel = require("../model/products"); // 👈 for fetching product details

// 🛒 Add to Cart
const addToCart = async (req, res) => {
  try {
    const { productsId } = req.params;
    const { quantity = 1, size } = req.body;
    const userId = req.user.userId;

    // 1️⃣ Validate size
    if (!size) {
      return res.status(400).json({ message: "Size is required" });
    }

    // 2️⃣ Fetch product WITH stock populated
    const product = await productModel
      .findById(productsId)
      .populate("stockId", "currentStock");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 3️⃣ Validate stock for selected size
    const stockForSize =
      product.stockId?.currentStock?.[size] ?? 0;

    if (stockForSize <= 0) {
      return res.status(400).json({
        message: `Size ${size} is out of stock`,
      });
    }

    if (quantity > stockForSize) {
      return res.status(400).json({
        message: `Only ${stockForSize} items available for size ${size}`,
      });
    }

    // 4️⃣ Find or create cart
    let cart = await cartModel.findOne({ userId });
    if (!cart) {
      cart = new cartModel({ userId, items: [], totalAmount: 0 });
    }

    // 5️⃣ Prevent duplicate product+size
    const existingItem = cart.items.find(
      (item) =>
        item.productsId.toString() === productsId &&
        item.size === size
    );

    if (existingItem) {
      return res.status(409).json({
        message: "Product already in cart",
      });
    }

    // 6️⃣ Add item
    cart.items.push({
      productsId,
      quantity,
      size,
      priceAtAdd: product.price,
    });

    // 7️⃣ Recalculate total
    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.quantity * item.priceAtAdd,
      0
    );

    await cart.save();

    res.status(200).json({
      message: "Product added to cart",
      cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// ❌ Remove from Cart (single item or clear entire cart)
const removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const userId = req.user.userId;

    const cart = await cartModel.findOne({ userId }).populate({
      path: "items.productsId",
      populate: { path: "stockId" }, // populate stock info
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Clear entire cart if no cartItemId provided
    if (!cartItemId) {
      cart.items = [];
      cart.totalAmount = 0;
      await cart.save();
      return res.status(200).json({
        message: "Cart cleared successfully",
        cartItems: [],
        totalAmount: 0,
      });
    }

    // Find and remove the specific item
    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === cartItemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    cart.items.splice(itemIndex, 1);

    // Recalculate totalAmount
    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.quantity * item.priceAtAdd,
      0
    );

    await cart.save();

    // Populate the items again after removal
    await cart.populate({
      path: "items.productsId",
      populate: { path: "stockId" },
    });

    // Return updated cart
    res.status(200).json({
      message: "Item removed successfully",
      cartItems: cart.items,
      totalAmount: cart.totalAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✏️ Update Cart Item (quantity or size)
const updateCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { size, quantity } = req.body;
    const userId = req.user.userId;

    let cart = await cartModel.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.id(cartItemId);
    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const product = await productModel
      .findById(item.productsId)
      .populate("stockId", "currentStock");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ size update
    if (size) {
      const stockForSize = product.stockId.currentStock?.[size] ?? 0;
      if (stockForSize < item.quantity) {
        return res.status(400).json({
          message: `Only ${stockForSize} items available for size ${size}`,
        });
      }
      item.size = size;
    }

    // ✅ quantity update
    if (quantity !== undefined) {
      const stockForSize =
        product.stockId.currentStock?.[item.size] ?? 0;

      if (quantity > stockForSize) {
        return res.status(400).json({
          message: `Only ${stockForSize} items available`,
        });
      }

      if (quantity <= 0) item.remove();
      else item.quantity = quantity;
    }

    cart.totalAmount = cart.items.reduce(
      (sum, i) => sum + i.quantity * i.priceAtAdd,
      0
    );

    await cart.save();

    // 🔥 IMPORTANT: re-fetch with populate
    cart = await cartModel
      .findOne({ userId })
      .populate({
        path: "items.productsId",
        select: "name image price stockId",
        populate: {
          path: "stockId",
          select: "currentStock",
        },
      });

    res.status(200).json({
      cartItems: cart.items.map((item) => ({
        _id: item._id,
        size: item.size,
        quantity: item.quantity,
        priceAtAdd: item.priceAtAdd,
        product: item.productsId,
      })),
      totalAmount: cart.totalAmount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


// 📦 Get All Cart Items (Updated)
const getAllCartItems = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await cartModel
      .findOne({ userId })
      .populate({
        path: "items.productsId",
        select: "name image price brand stockId",
        populate: {
          path: "stockId",
          select: "currentStock",
        },
      });

    if (!cart || !cart.items.length) {
      return res.status(200).json({
        cartItems: [],
        totalItems: 0,
        totalAmount: 0,
      });
    }

    const cartItems = cart.items
      .filter(item => item.productsId)
      .map(item => {
        const product = item.productsId;
        const size = item.size;

        const stockForSize =
          product.stockId?.currentStock?.[size] ?? 0;

        const validQty = Math.min(item.quantity, stockForSize);

        return {
          _id: item._id,
          product,
          size,
          quantity: validQty,
          priceAtAdd: item.priceAtAdd,
          currentStock: stockForSize,
          outOfStock: stockForSize === 0,
        };
      });

    res.status(200).json({
      cartItems,
      totalItems: cartItems.length,
      totalAmount: cartItems.reduce(
        (sum, item) => sum + item.quantity * item.priceAtAdd,
        0
      ),
    });
  } catch (error) {
    console.error("Cart fetch error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


module.exports = {
  addToCart,
  removeFromCart,
  updateCartItem,
  getAllCartItems,
};
