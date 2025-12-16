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

    // 2️⃣ Find product
    const product = await productModel.findById(productsId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 3️⃣ Find or create cart
    let cart = await cartModel.findOne({ userId });
    if (!cart) {
      cart = new cartModel({ userId, items: [], totalAmount: 0 });
    }

    // 4️⃣ Check if SAME product + SAME size already exists
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

    // 5️⃣ Add new item
    cart.items.push({
      productsId,
      quantity,
      size,
      priceAtAdd: product.price,
    });

    // 6️⃣ Update totalAmount
    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.quantity * item.priceAtAdd,
      0
    );

    await cart.save();

    return res.status(200).json({
      message: "Product added to cart",
      cart,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// ❌ Remove from Cart (single item or clear entire cart)
const removeFromCart = async (req, res) => {
  try {
    const { cartId, cartItemId } = req.params;

    const cart = await cartModel.findById(cartId);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    if (!cartItemId) {
      // 🧹 Clear entire cart
      cart.items = [];
      cart.totalAmount = 0;
      await cart.save();
      return res.status(200).json({ message: "Cart cleared successfully" });
    }

    // 🗑️ Remove specific item
    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === cartItemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    cart.items.splice(itemIndex, 1);

    // Update total amount
    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.quantity * item.priceAtAdd,
      0
    );

    await cart.save();
    res.status(200).json({ message: "Item removed successfully", cart });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✏️ Update Cart Item (quantity or size)
const updateCartItem = async (req, res) => {
  try {
    const { cartId, cartItemId } = req.params;
    const { size, quantity } = req.body;

    const cart = await cartModel.findById(cartId);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find((i) => i._id.toString() === cartItemId);

    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Update only provided fields
    if (size) item.size = size;

    if (quantity !== undefined) {
      if (quantity <= 0) {
        // Remove item if quantity <= 0
        cart.items = cart.items.filter((i) => i._id.toString() !== cartItemId);
      } else {
        item.quantity = quantity;
      }
    }

    // Recalculate total
    cart.totalAmount = cart.items.reduce(
      (total, i) => total + i.quantity * i.priceAtAdd,
      0
    );

    await cart.save();

    res.status(200).json({
      message: "Cart item updated successfully",
      cart,
    });
  } catch (error) {
    console.log(error);
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
        select: "name image price sizes brand currentStock",
      });

    if (!cart) {
      return res.status(200).json({
        message: "Cart is empty",
        cartItems: [],
        totalAmount: 0,
        totalItems: 0,
      });
    }

    const cartItems = cart.items
      .filter(item => item.productsId)
      .map(item => ({
        _id: item._id,
        productId: item.productsId,
        size: item.size,
        quantity: Math.min(item.quantity, item.productsId.currentStock),
        priceAtAdd: item.priceAtAdd,
        outOfStock: item.productsId.currentStock === 0,
      }));

    res.status(200).json({
      message: "Cart fetched successfully",
      cartItems,
      totalAmount: cart.totalAmount,
      totalItems: cartItems.length,
      lastUpdated: cart.updatedAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  addToCart,
  removeFromCart,
  updateCartItem,
  getAllCartItems,
};
