const jwt = require("jsonwebtoken");
require("dotenv").config();

const getToken = (req) => {
  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }

  // Check cookies
  if (req.cookies?.token) {
    return req.cookies.token;
  }

  return null;
};

const authMiddleware = (req, res, next) => {
  try {
    const token = getToken(req);

    if (!token) {
      console.warn("Auth Middleware: No token found in request");
      return res.status(401).json({
        message: "Authentication required",
        code: "NO_TOKEN",
      });
    }
console.log(token)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      console.error("JWT Verify Error:", err.name, err.message);

      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Session expired. Please login again.",
          code: "TOKEN_EXPIRED",
        });
      }

      return res.status(401).json({
        message: "Invalid authentication token",
        code: "INVALID_TOKEN",
      });
    }

    // ✅ Token valid
    req.user = decoded; // { userId, email, name, seller }
    next();
  } catch (error) {
    console.error("Auth Middleware Unexpected Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const sellerMiddleware = (req, res, next) => {
  try {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
        code: "NO_TOKEN",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded.seller) {
      return res.status(403).json({
        message: "Seller access required",
        code: "NOT_SELLER",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Seller Middleware Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Session expired. Please login again.",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      message: "Invalid authentication token",
      code: "INVALID_TOKEN",
    });
  }
};
module.exports = {
  authMiddleware,
  sellerMiddleware,
};