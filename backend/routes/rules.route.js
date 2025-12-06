const express = require("express");
const rulesRouter = express.Router();

const {createRules,getAllRules,getRulesByCategory,updateRule,deleteRule} = require("../controllers/rules")

rulesRouter.post("/",createRules)
rulesRouter.get("/",getAllRules)
rulesRouter.get("/:category",getRulesByCategory)
rulesRouter.put("/:id",updateRule)
rulesRouter.delete("/:id",deleteRule)

module.exports = rulesRouter