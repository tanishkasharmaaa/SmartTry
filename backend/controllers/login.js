const bcrypt = require('bcrypt');
const userModel = require('../model/users');
const generateToken = require('../utils/generateToken');


const login = async (req, res) => {
  try {
    const { email, password } = req.body;
console.log("Login Request Body:", req.body); // ✅ Debugging line
    const user = await userModel.findOne({ email });
    console.log("Login User Found:", user); // ✅ Debugging line
    if (!user || !user.email) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordMatched = bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = await generateToken(
      user.name,
      user.email,
      user._id,
      user.seller
    );
    console.log("Generated JWT:", token);

    // Remove password before sending user data
    const userData = user.toObject();
    delete userData.password;
    console.log("User Data to be sent:", userData, "Token:", token);
    // Set token in secure cookies
    res.cookie("token", token, {
      httpOnly: true,       // JS cannot access it → secure
      secure: true,         // only HTTPS (Render uses HTTPS)
      sameSite: "none",     // required for cross-site cookies
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    });

    return res.status(200).json({
      message: "Login successful",
      user: userData,
      token: token, // optional: you may remove this if storing only in cookies
    });

  } catch (error) {
    console.log("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {login}