const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
require("dotenv").config();
const User = require("../models/Users");
const jwt = require("jsonwebtoken");
const generator = require("generate-password");
const { findOneAndUpdate } = require("../models/PropertyTypes");

// Node Mailer Configurations
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use environment variables
  },
});

// Controllers

//?                              Done                              //

// Signup
exports.googleSignin = async (req, res) => {
  try {
    const { name, email } = req.body;
    const existingUser = await User.find({ email });
    if (existingUser.length !== 0) {
      return res.status(200).json({
        message: "User already exists with this email.",
        role: existingUser[0].role,
      });
    }
    const password = generator.generate({
      length: 12,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
      excludeSimilarCharacters: true,
    });
    const encryptedPassword = await bcrypt.hash(password, 10);
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Property Mission 24/7 Google Signin",
      html: `<b>Thank you for join PropertyMission24x7.<br />This is your password if you want to login using Email and Password: ${password}. <h3>Note:</h3>You can also reset the password.</b>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        if (!res.headersSent) {
          return res.status(500).json({ error: "Error sending OTP via email" });
        }
      }
    });
    const phone = "0000000000";
    const contact = parseInt(phone);
    const newUser = new User({
      username: name,
      email,
      password: encryptedPassword,
      phone: contact,
      active: true,
    });
    await newUser.save();
    return res
      .status(200)
      .json({ message: "Successfully Registered", role: newUser.role });
  } catch (error) {
    console.log(error);
    return res.status(500).json("Internal Server Error.");
  }
};

exports.signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, phone, email, password } = req.body;
    const existingPhone = await User.findOne({ phone });
    const existingEmail = await User.findOne({ email });
    if (existingEmail || existingPhone) {
      return res
        .status(400)
        .json({ msg: "User with same email or phone number already exists." });
    }

    const otp = generateOTP();
    if (!otp) {
      return res.status(400).json({ msg: "Failed to generate OTP." });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Property Mission 24/7 Verification",
      html: `<b>Your email OTP code is ${otp}. It will expire in 10 minutes.</b>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending OTP:", error);
        return res.status(500).json({ msg: "Error sending OTP via email" });
      }
    });

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? "admin" : "user";

    const newUser = new User({
      username: name,
      phone,
      email,
      password,
      otp,
      role,
    });
    const user = await newUser.save();
    return res.status(200).json(user);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Internal Server Error", error: err });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const storedData = await User.findOne({ email });
    if (otp != storedData.otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }
    const id = storedData._id;
    const activatedUser = await User.findByIdAndUpdate(id, { active: true });
    return res
      .status(200)
      .json({ msg: "OTP verified successfully", activatedUser });
  } catch (err) {
    console.error("Error during OTP verification:", err);
    return res
      .status(500)
      .json({ msg: "Internal Server Error.", err: err.message });
  }
};

exports.login = async (req, res) => {
  const { email_phone, password } = req.body;
  let phone, email, existingUser, storedPassword;

  try {
    if (isEmail(email_phone)) {
      email = email_phone;
    } else if (isPhoneNumber(email_phone)) {
      phone = email_phone;
    } else {
      return res.status(400).json({ msg: "Invalid Email Or Phone Number." });
    }
    if (phone) {
      existingUser = await User.findOne({ phone });
    } else {
      existingUser = await User.findOne({ email });
    }
    if (!existingUser) {
      return res.status(400).json({ msg: "User not found." });
    }
    if (existingUser.active === false) {
      return res.status(401).json({ msg: "You are not verifed." });
    }
    const token = jwt.sign(
      { userId: existingUser._id, role: existingUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    req.session.token = token;

    storedPassword = existingUser.password;

    const isMatch = await bcrypt.compare(password, storedPassword);
    if (!isMatch) {
      return res.status(400).json({ msg: "Password is incorrect." });
    }
    return res.status(200).json({
      msg: "You are logged in successfully",
      user: existingUser,
      token,
    });
  } catch (err) {
    return res.status(500).json({ msg: "Internal Server Error", error: err });
  }
};

exports.fetchUsers = async (req, res) => {
  try {
    const users = await User.find().lean();
    if (!users) {
      return res.status(400).json({ msg: "No user found!" });
    }
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ msg: "Internal Server Error." });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, phone, role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(id, {
      username,
      email,
      phone,
      role,
    });
    if (!updatedUser) {
      return res.status(404).json({ msg: "User Not Found." });
    }
    return res.status(200).json({ msg: "User updated successfully." });
  } catch (err) {
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ msg: "User Not Found" });
    }
    return res.status(200).json({ msg: "Deleted User Successfully. " });
  } catch (err) {
    return res.json({ msg: "Internal Server Error." });
  }
};

exports.forgotPass = async (req, res) => {
  const { email } = req.body;
  existingUser = await User.findOne({ email });
  if (!existingUser) {
    return res.status(400).json({ msg: "No user found." });
  }
  const otp = generateOTP();
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: existingUser.email,
    subject: "Property Mission 24/7 Verification",
    html: `<h1><b>Password reset request.</b></h1>
        <br/>
        <p>Here is your OTP to reset your password: ${otp}</p>
        <br/>
        <p>Never Share Your OTP and Password with anyone.</p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      if (!res.headersSent) {
        return res.status(500).json({ error: "Error sending OTP via email" });
      }
    }
  });
  const id = existingUser._id;
  const user = await User.findByIdAndUpdate(id, { otp });
  return res.status(200).json({ user });
};

exports.updatePass = async (req, res) => {
  try {
    const { email, newPassword, otp } = req.body;
    console.log(req.body);
    const existingUser = await User.findOne({ email });
    if (existingUser.otp != otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    if (!encryptedPassword) {
      return res
        .status(400)
        .json({ msg: "Unable to change password please try again later." });
    }
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { password: encryptedPassword },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(400).json({ msg: "Password update failed." });
    }
    return res.status(200).json({ msg: "Password updated successfully." });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Internal Server Error." });
  }
};

//?                              Functions                              //
const isEmail = (str) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(str);
};
const isPhoneNumber = (str) => {
  const phonePattern = /^\d{10}$/;
  return phonePattern.test(str);
};
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}
