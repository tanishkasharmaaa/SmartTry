const bcrypt = require('bcrypt');
const userModel = require('../model/users');
const generateToken = require('../utils/generateToken');


const login = async(req,res)=>{
    try {
       const {email,password} = req.body;
       const user = await userModel.findOne({email});
       console.log(user)
       if(user){
        const isPasswordMatched = bcrypt.compare(password,user.password)
        if(isPasswordMatched){
            const token = await generateToken(user.name,user.email,user._id,user.seller)
            res.status(200).json({message:"Login successful",user,token})
        }
       } 
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Intternal server error"})
    }
}
module.exports = {login}