const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const generateToken = require("../utils/generateToken");
const userModel = require("../model/users");
const cartModel = require("../model/cart"); // ✅ IMPORT CART
require("dotenv").config();

const authRouter = express.Router();

/* ================================
    GOOGLE AUTH ROUTES
================================ */

// 1️⃣ Google Login
authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 2️⃣ Google Callback
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    try {
      const email = req.user.emails[0].value;
      const name = req.user.displayName;
      const image = req.user.photos?.[0]?.value || "";

      let user = await userModel.findOne({ email });

      /* ============================
         CREATE USER (LIKE createUser)
      ============================ */
      if (!user) {
        user = await userModel.create({
          name,
          email,
          password: "", // Google users don't need password
          image,
          birthday: "",
          gender: "",
          bio: "",
          seller: false,
          sellerInfo: null,
        });
      }

      /* ============================
         CREATE CART IF NOT EXISTS
      ============================ */
      if (!user.cartId) {
        const cart = await cartModel.create({
          userId: user._id,
          items: [],
          totalAmount: 0,
        });

        user.cartId = cart._id;
        await user.save();
      }

      /* ============================
         GENERATE JWT
      ============================ */
      const token = await generateToken(
        user.email,
        user.name,
        user._id,
        user.seller
      );

      /* ============================
         SET COOKIE
      ============================ */
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect(process.env.CLIENT_URL);
    } catch (error) {
      console.error("❌ Google Auth Error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  }
);


/* ================================
    GET USER PROFILE
================================ */
authRouter.get("/profile", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await userModel
      .findById(decoded.userId)
      .select("-password"); // 🔥 never send password

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});


/* ================================
    LOGOUT
================================ */
authRouter.get("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  req.logout(() => {
    return res.redirect(process.env.CLIENT_URL);
  });
});

module.exports = authRouter;
