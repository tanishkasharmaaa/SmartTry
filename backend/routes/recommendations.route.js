const express = require("express");
const recomendationRouter = express.Router()
const {recommendations} = require("../controllers/recommendation")

recomendationRouter.get("/:userId",recommendations)

module.exports = recomendationRouter
