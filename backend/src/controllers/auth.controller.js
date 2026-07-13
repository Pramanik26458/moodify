const userModel = require("../models/users.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const blacklistModel=require("../models/blacklist.model")
const redis=require("../config/cache");


// ================= REGISTER =================

async function registerUser(req, res) {

  try {

    const { username, email, password } = req.body;

    // ================= VALIDATIONS =================

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // ================= CHECK EMAIL =================

    const existingEmail = await userModel.findOne({
      email,
    });

    if (existingEmail) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }

    // ================= CHECK USERNAME =================

    const existingUsername = await userModel.findOne({
      username,
    });

    if (existingUsername) {
      return res.status(409).json({
        message: "Username already taken",
      });
    }

    // ================= HASH PASSWORD =================

    const hash = await bcrypt.hash(password, 10);

    // ================= CREATE USER =================

    const user = await userModel.create({
      username,
      email,
      password: hash,
    });

    // ================= TOKEN =================

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "3d",
      }
    );

    // ================= COOKIE =================

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    // ================= RESPONSE =================

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
}



// ================= LOGIN =================

async function login(req, res) {

  try {

    const { email, password } = req.body;

    // ================= VALIDATIONS =================

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // ================= FIND USER =================

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // ================= CHECK PASSWORD =================

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // ================= TOKEN =================

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "3d",
      }
    );

    // ================= COOKIE =================

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    // ================= RESPONSE =================

    return res.status(200).json({
      success: true,
      message: `Welcome back ${user.username}`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
}



// ================= LOGOUT =================

async function logout(req, res) {
  try {

    const token = req.cookies.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token not found",
      });
    }

    res.clearCookie("token");

    // blacklist token
    await redis.set(token, Date.now().toString(),"EX",60*60);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
}

//

 /**
 * @action Get Current User
 * @description Fetch currently logged-in user details
 * @access Private
 * @route GET /auth/get-me
 */
async function getMe(req, res) {

  try {

    // ================= FIND USER =================

    const user = await userModel
      .findById(req.user.id)
      .select("-password");

    // ================= CHECK USER =================

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ================= RESPONSE =================

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
}



module.exports = {
  registerUser,
  login,
  logout,
  getMe
};