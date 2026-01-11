require("dotenv").config();
const jwt = require("jsonwebtoken");

const getToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  if (req.cookies?.token) {
    return req.cookies.token;
  }

  return null;
};

const authMiddleware = (req, res, next) => {
  try {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
        code: "NO_TOKEN",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = decoded; // { userId, email, name, seller }
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);

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