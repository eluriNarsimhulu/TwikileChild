const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Database Connection
const mongoUrl = 'mongodb://localhost:27017/management_system';
mongoose.connect(mongoUrl, {
  serverApi: {
    version: "1",
    strict: true,
    deprecationErrors: true,
  },
})
.then(() => {
  console.log("Database connected successfully.");
})
.catch((error) => {
  console.error("Database connection failed:", error.message);
});

// JWT Verification Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Get token from headers
  if (!token) return res.status(403).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, "secretkey");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ========================
// Schemas and Models
// ========================

// Admin Schema
const adminSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});
const Admin = mongoose.model("Admin", adminSchema);

// Client Schema (Updated to include children)
const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  children: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Child' 
  }]
});
const Client = mongoose.model("Client", clientSchema);

// Child Schema
const childSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  gameHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "GameHistory" }]
});
const Child = mongoose.model("Child", childSchema);

// Game History Schema
const gameHistorySchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  startTime: Date,
  endTime: Date,
  score: Number
});
const GameHistory = mongoose.model("GameHistory", gameHistorySchema);

// ========================
// Dummy Admin Data
// ========================
const createDummyAdmin = async () => {
  const adminExists = await Admin.findOne({ email: "admin@example.com" });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await Admin.create({ email: "admin@example.com", password: hashedPassword });
    console.log("Dummy Admin Created");
  }
};
createDummyAdmin();

// ========================
// Routes
// ========================

// Client Signup
app.post("/signup", async (req, res) => {
  const { name, email, password, address, mobileNumber } = req.body;
  
  try {
    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ message: "Client already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newClient = new Client({ 
      name, 
      email, 
      password: hashedPassword, 
      address, 
      mobileNumber 
    });
    await newClient.save();
    
    res.status(201).json({ message: "Client signed up successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error signing up", error: error.message });
  }
});

// Login (Admin or Client)
app.post("/login", async (req, res) => {
  const { email, password, isAdmin } = req.body;
  const Model = isAdmin ? Admin : Client;

  try {
    const user = await Model.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ 
      email: user.email, 
      isAdmin, 
      id: user._id 
    }, "secretkey", { expiresIn: "1h" });

    res.json({ 
      message: "Login successful", 
      token,
      isAdmin
    });
  } catch (error) {
    res.status(500).json({ message: "Login error", error: error.message });
  }
});

// ========================
// Children and Game History Routes
// ========================

// Add a new child for a client
app.post("/children", verifyToken, async (req, res) => {
  try {
    const { name, age } = req.body;
    const newChild = new Child({
      name,
      age: parseInt(age),
      parentId: req.user.id
    });
    await newChild.save();

    // Update client's children array
    await Client.findByIdAndUpdate(
      req.user.id, 
      { $push: { children: newChild._id } },
      { new: true }
    );

    res.status(201).json(newChild);
  } catch (error) {
    res.status(500).json({ message: "Error adding child", error: error.message });
  }
});

// Get all children for a client
app.get("/children", verifyToken, async (req, res) => {
  try {
    const children = await Child.find({ parentId: req.user.id });
    res.json(children);
  } catch (error) {
    res.status(500).json({ message: "Error fetching children", error: error.message });
  }
});

// Record game history
app.post("/game-history", verifyToken, async (req, res) => {
  try {
    const { childId, startTime, endTime, score } = req.body;
    
    // Validate that we have all required fields and score is greater than 0
    if (!childId || !startTime || !endTime || !score || score <= 0) {
      return res.status(400).json({ 
        message: "Invalid game history data. Score must be greater than 0." 
      });
    }
    
    const gameHistory = new GameHistory({
      childId,
      startTime,
      endTime,
      score
    });

    await gameHistory.save();

    // Update child's game history
    await Child.findByIdAndUpdate(
      childId,
      { $push: { gameHistory: gameHistory._id } },
      { new: true }
    );

    res.status(201).json(gameHistory);
  } catch (error) {
    res.status(500).json({ message: "Error recording game history", error: error.message });
  }
});
// Get game history for a specific child
app.get("/game-history/:childId", verifyToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const gameHistory = await GameHistory.find({ childId });
    res.json(gameHistory);
  } catch (error) {
    res.status(500).json({ message: "Error fetching game history", error: error.message });
  }
});

// ========================
// Server Setup
// ========================
app.listen(5000, () => console.log("Server running on port 5000"));
