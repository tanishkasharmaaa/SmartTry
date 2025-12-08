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

// 1️⃣ Google Login URL
authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 2️⃣ Callback URL
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    try {
      const email = req.user.emails[0].value;
      const name = req.user.displayName;
      const image = req.user.photos?.[0]?.value;

      // Check if user exists
      let user = await userModel.findOne({ email });

      if (!user) {
        user = new userModel({
          name,
          email,
          password: "",
          image: image || "",
          seller: false,
          sellerInfo: {}
        });

        await user.save();
      }

      // Create JWT
      const token = await generateToken(
        user.email,
        user.name,
        user._id,
        user.seller
      );

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // ---- IMPORTANT ----
      // Redirect user to frontend
      return res.redirect(process.env.CLIENT_URL); // frontend home page

    } catch (error) {
      console.error("Google Auth Error:", error);
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel
      .findById(decoded.id)
      .select("name email image");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      name: user.name,
      email: user.email,
      photo: user.image,
    });

  } catch {
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
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = authRouter;
