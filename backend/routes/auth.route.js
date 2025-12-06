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

module.exports = authRouter;
