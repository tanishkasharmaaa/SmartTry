require("dotenv").config()
const jwt = require("jsonwebtoken");

const authMiddleware = async(req,res,next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        if(token){
            jwt.verify(token,process.env.JWT_SECRET_KEY,(err,decoded)=>{
                if(err){
                    return res.status(401).json({message:"Uanuthorized"})
                }
                req.user = decoded;
                next()
            })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"Internal server error"})
    }
}

const sellerMiddleware = async(req,res,next) => {
      try {
        const token = req.headers.authorization.split(" ")[1];
        if(token){
            jwt.verify(token,process.env.JWT_SECRET_KEY,(err,decoded)=>{
                if(err){
                    return res.status(401).json({message:"Uanuthorized"})
                }
                if(!decoded.isSeller){
                    return res.status(403).json({message:"Forbidden: Seller access required"})
                }
                req.user = decoded;
                console.log("Seller verified:", decoded);
                next()
            })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"Internal server error"})
    }
}
module.exports = {authMiddleware,sellerMiddleware};