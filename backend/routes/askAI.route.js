const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const askAI = require("../utils/askAI");
const askAiRouter = express.Router();

askAiRouter.post("/",authMiddleware,askAI)

module.exports = askAiRouter