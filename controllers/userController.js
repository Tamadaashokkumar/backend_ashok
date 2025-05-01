const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotEnv = require("dotenv");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

dotEnv.config();

const secretKey = process.env.WhatIsYourName;

// 🔹 Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "user_images",
    format: async (req, file) => "jpg", // Convert all uploads to JPG format
    public_id: (req, file) => Date.now() + "-" + file.originalname, // Unique file name
  },
});

const upload = multer({ storage: storage });

const userRegister = async (req, res) => {
  const { username, email, password } = req.body;
  const image = req.file ? req.file.path : undefined;
  try {
    const userEmail = await User.findOne({ email });
    if (userEmail) {
      return res.status(400).json({ message: "Email already taken" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      image,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
    console.log("registered");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const userLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid username" });
    } else if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: "1h",
    });

    const userId = user._id;

    res.status(200).json({ message: "Login successful", token, userId });
    console.log(email, "this is token", token);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { userRegister, userLogin };
