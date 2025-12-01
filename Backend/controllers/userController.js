const User = require("../models/User");
const Food = require("../models/Food");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "yourSecretKey";

// ------------------------------------------------------------------
// REGISTER USER
// ------------------------------------------------------------------
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("Register User:", name, email);

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashed,
    });

    await newUser.save();

    // Create JWT token
    const token = jwt.sign({ id: newUser._id }, SECRET_KEY, { expiresIn: "7d" });

    return res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------------------
// LOGIN USER
// ------------------------------------------------------------------
exports.login = async (req, res) => {
  try {
    console.log("Login request received:", req.body);
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "7d" });

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------------------
// GET USER WITH FOOD HISTORY
// ------------------------------------------------------------------
exports.getUserWithFoods = async (req, res) => {
  try {
    console.log("Received request to get user with foods:", req.query);

    // Verify token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Unauthorized: No token" });

    const decoded = jwt.verify(token, SECRET_KEY);
    if (!decoded)
      return res.status(403).json({ message: "Unauthorized: Invalid token" });

    // Get userId
    const userId = req.query.userId;
    if (!userId) {
      console.log("❌ No userId in request");
      return res.status(400).json({ message: "User ID is required" });
    }

    console.log("✅ userId:", userId);

    // Fetch user and foods
    const user = await User.findById(userId).populate("foodHistory");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      foodHistory: user.foodHistory || [],
    });
  } catch (error) {
    console.error("Error fetching user with foods:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Server error" });
    }
  }
};
