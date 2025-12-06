const mongoose = require("mongoose");
require("dotenv").config();

const connection = async()=>{
    try {
        const conn=await mongoose.connect(process.env.MONGODB_URI)
        console.log(`✅ Connected to Mongodb`)
    } catch (error) {
        console.log(error)
    }
}
module.exports = connection
