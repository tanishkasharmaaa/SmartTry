const express = require("express");
const passport = require("passport");
const generateToken = require("../utils/generateToken");
const authRouter = express.Router();
const userModel = require("../model/users");
require("dotenv").config();

// GOOGLE AUTH ROUTE
authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    try {
      // Google returns user info inside req.user
      const email = req.user.emails[0].value;
      const name = req.user.displayName;
      const image = req.user.photos?.[0]?.value;

      // check if user exists
      let user = await userModel.findOne({ email });

      if (!user) {
        // Create new Google user
        user = new userModel({
          name: name,
          email: email,
          password: "",               // No password for Google users
          image: image || "",
          seller: false,              // Default: not seller
          sellerInfo: {}
        });

        await user.save();
      }

      // Generate JWT
      const token = await generateToken(user.email, user.name, user._id, user.seller);

       res.cookie("token", token, {
        httpOnly: true,            // Cannot be accessed by JS
        secure: true,              // true if using HTTPS (Render/Production)
        sameSite: "none",          // Required for cross-site cookies
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Redirect or send response
      return res.status(200).json({
        message: user ? "User logged in successfully" : "User created successfully",
        user,
        token
      });

    } catch (error) {
      console.error("Error in Google callback:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

authRouter.get("/profile", async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await userModel
      .findById(decoded.id)
      .select("name email photo");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      name: user.name,
      email: user.email,
      photo: user.photo,
    });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

// ---------------------------------- LOGOUT ----------------------------------
authRouter.get("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
  });

  req.logout(() => {
    res.redirect("/auth");
  });
});


module.exports = authRouter;
