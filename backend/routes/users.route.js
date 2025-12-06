const express = require('express');
const userRouter = express.Router();
const {createUser,updateUser,deleteUser,getUserById} = require("../controllers/users");

// CREATE NEW USER
userRouter.post("/",createUser)
// UPDATE USER
userRouter.put("/:userId",updateUser)
//DELETE USER
userRouter.delete("/:userId",deleteUser)
// GET USER BY ID
userRouter.get("/:userId",getUserById)
// LOGIN USER


module.exports = userRouter

