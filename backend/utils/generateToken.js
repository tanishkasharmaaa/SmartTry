const jwt = require("jsonwebtoken")

const generateToken = async(email,name,userId,isSeller) => {
try {
    console.log("Generating token for:", {email,name,userId,isSeller});
    const token = jwt.sign({email:email,name:name,userId:userId,isSeller:isSeller},process.env.JWT_SECRET_KEY,{algorithm:"HS256",expiresIn:'7d'},)
    return token
} catch (error) {
   console.log(error)
   res.status(500).json({message:"Internal server error"}) 
}
}

module.exports = generateToken