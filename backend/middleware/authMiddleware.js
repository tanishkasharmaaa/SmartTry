require("dotenv").config()
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ Token from cookies (httpOnly)
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // 3️⃣ No token found
    if (!token) {
      return res.status(401).json({
        message: "Unauthorized: Token missing",
      });
    }

    // 4️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({
      message: "Unauthorized: Invalid token",
    });
  }
};

const sellerMiddleware = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ Cookie fallback
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // 3️⃣ Token missing
    if (!token) {
      return res.status(401).json({
        message: "Unauthorized: Token missing",
      });
    }

    // 4️⃣ Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // 5️⃣ Seller check
    if (!decoded.isSeller) {
      return res.status(403).json({
        message: "Forbidden: Seller access required",
      });
    }

    req.user = decoded;
    console.log("✅ Seller verified:", decoded.userId);

    next();
  } catch (error) {
    console.error("Seller Middleware Error:", error.message);

    return res.status(401).json({
      message: "Unauthorized: Invalid or expired token",
    });
  }
};

module.exports = {authMiddleware,sellerMiddleware};