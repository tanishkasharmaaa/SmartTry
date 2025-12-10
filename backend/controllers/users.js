const userModel = require("../model/users");
const bcrypt = require("bcrypt");
const {sendSignupEmail} = require("../services/sendSignupEmail")

// CREATE USER
const createUser = async (req, res) => {
  const body = req.body;

  try {
    // CHECK IF USER ALREADY EXISTS
    const checkUser = await userModel.findOne({ email: body.email });
    if (checkUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // PASSWORD VALIDATION
    if (!body.password || body.password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // CREATE USER
    const user = new userModel({
      name: body.name,
      email: body.email,
      password: hashedPassword,
      image: body.image || "",
      birthday: body.birthday || "",
      gender: body.gender || "",
      bio: body.bio || "",
      seller: body.seller || false,
      sellerInfo: body.seller
        ? {
            sellerName: body.sellerInfo?.sellerName || "",
            gstNumber: body.sellerInfo?.gstNumber || "",
            businessName: body.sellerInfo?.businessName || "",
            businessAddress: body.sellerInfo?.businessAddress || "",
            contactNumber: body.sellerInfo?.contactNumber || "",
            website: body.sellerInfo?.website || "",
            description: body.sellerInfo?.description || "",
          }
        : null,
    });

    await user.save();

    // REMOVE PASSWORD BEFORE SENDING RESPONSE
    const userData = user.toObject();
    delete userData.password;

    // 📧 SEND SIGNUP EMAIL SAFELY
    // let emailSent = false;
    // try {
    //   const emailResponse = await sendSignupEmail(
    //     body.email,
    //     "Welcome to SmartTry!",
    //     { username: body.name }
    //   );

    //   // CHECK IF EMAIL SEND SUCCEEDED
    //   emailSent = emailResponse?.success || false;
    // } catch (emailError) {
    //   console.log("❌ Signup email error:", emailError);
    // }

    // // ✅ RETURN RESPONSE
    // if (emailSent) {
    //   res.status(201).json({
    //     message: "User created successfully! Confirmation email sent.",
    //     user: userData,
    //   });
    // } else {
      res.status(201).json({
        message: "User created successfully! But email could not be sent.",
        user: userData,
      });
    // }

  } catch (error) {
    console.log("❌ createUser Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// UPDATE USER
const updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const body = req.body;
    const user = await userModel.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = body.password ? await bcrypt.hash(body.password, 10) : user.password;

    user.name = body.name ?? user.name;
    user.email = body.email ?? user.email;
    user.password = hashedPassword;
    user.image = body.image ?? user.image;
    user.birthday = body.birthday ?? user.birthday;
    user.gender = body.gender ?? user.gender;
    user.bio = body.bio ?? user.bio;
    user.seller = body.seller ?? user.seller;

    if (user.seller) {
      user.sellerInfo = {
        sellerName: body.sellerInfo?.sellerName ?? user.sellerInfo?.sellerName ?? "",
        gstNumber: body.sellerInfo?.gstNumber ?? user.sellerInfo?.gstNumber ?? "",
        businessName: body.sellerInfo?.businessName ?? user.sellerInfo?.businessName ?? "",
        businessAddress: body.sellerInfo?.businessAddress ?? user.sellerInfo?.businessAddress ?? "",
        contactNumber: body.sellerInfo?.contactNumber ?? user.sellerInfo?.contactNumber ?? "",
        website: body.sellerInfo?.website ?? user.sellerInfo?.website ?? "",
        description: body.sellerInfo?.description ?? user.sellerInfo?.description ?? "",
      };
    } else {
      user.sellerInfo = null;
    }

    await user.save();

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({ message: "User updated successfully", user: userData });
  } catch (error) {
    console.log("❌ updateUser Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// DELETE USER
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await userModel.findByIdAndDelete(userId);
    if (user) res.status(200).json({ message: "User deleted successfully" });
    else res.status(404).json({ message: "User not found" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET USER BY ID
const getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({ message: "User fetched successfully", user: userData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createUser, updateUser, deleteUser, getUserById };
