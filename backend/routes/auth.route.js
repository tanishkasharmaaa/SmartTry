const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const generateToken = require("../utils/generateToken");
const userModel = require("../model/users");
require("dotenv").config();

const authRouter = express.Router();

/* ================================
    GOOGLE AUTH ROUTES
================================ */

// 🔹 GOOGLE LOGIN
authRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false, // ✅ IMPORTANT
  })
);

// 🔹 GOOGLE CALLBACK
authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
    session: false, // ✅ IMPORTANT
  }),
  async (req, res) => {
    try {
      const email = req.user.emails[0].value;
      const name = req.user.displayName;
      const image =
        req.user.photos && req.user.photos.length > 0
          ? req.user.photos[0].value
          : "";

      let user = await userModel.findOne({ email });

      if (!user) {
        user = new userModel({
          name,
          email,
          password: "",
          image,
          seller: false,
          birthday: "",
          gender: "",
          bio: "",
          sellerInfo: {},
        });

        await user.save();
      } else if (!user.image && image) {
        // 🔥 Update image if missing
        user.image = image;
        await user.save();
      }

      // ✅ GENERATE JWT
      const token = await generateToken(
        user.email,
        user.name,
        user._id,
        user.seller
      );

      // ✅ SET COOKIE
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect(process.env.CLIENT_URL);
    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  }
);

/* ================================
    GET USER PROFILE (JWT BASED)
================================ */
authRouter.get("/profile", async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await userModel
      .findById(decoded.userId)
      .select("_id name email image seller");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      userId: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      seller: user.seller,
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
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

  return res.redirect(process.env.CLIENT_URL);
});

module.exports = authRouter;
