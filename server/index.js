const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

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

// ========================
// JWT Verification Middleware
// ========================
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

// Client Schema
const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  mobileNumber: { type: String, required: true }
});
const Client = mongoose.model("Client", clientSchema);

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

// Get all clients (Protected route)
app.get("/clients", verifyToken, async (req, res) => {
  try {
    // Only admin can access this route
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }
    const clients = await Client.find().select('-password');
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: "Error fetching clients", error: error.message });
  }
});

// Add a new client (Protected route)
app.post("/clients", verifyToken, async (req, res) => {
  try {
    // Only admin can add clients
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }
    const { name, email, address, mobileNumber } = req.body;
    const newClient = new Client({ name, email, address, mobileNumber, password: 'temp_password' });
    await newClient.save();
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ message: "Error adding client", error: error.message });
  }
});

// Delete a client (Protected route)
app.delete("/clients/:id", verifyToken, async (req, res) => {
  try {
    // Only admin can delete clients
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }
    const { id } = req.params;
    await Client.findByIdAndDelete(id);
    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting client", error: error.message });
  }
});

// Sample protected route for students (Adjust if needed)
app.get("/students", verifyToken, async (req, res) => {
  try {
    // Here, adjust based on your project logic.
    const students = await Client.find(); // Assuming clients are your "students"
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching students", error: error.message });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
