const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*"
}));

// Database Connection
const mongoUrl = process.env.MONGO_URI;
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    }, process.env.JWT_SECRET, { expiresIn: "1h" });

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

// Add these routes to your server/index.js file

// Delete a child
app.delete("/children/:childId", verifyToken, async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Verify that the child belongs to the authenticated user
    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }
    
    // Check if the child belongs to the authenticated user
    if (child.parentId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized: Child does not belong to this user" });
    }
    
    // Delete all game history entries associated with this child
    await GameHistory.deleteMany({ childId });
    
    // Remove the child from the client's children array
    await Client.findByIdAndUpdate(
      req.user.id,
      { $pull: { children: childId } }
    );
    
    // Delete the child
    await Child.findByIdAndDelete(childId);
    
    res.json({ message: "Child and associated game history deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting child", error: error.message });
  }
});

// Delete a game history entry
app.delete("/game-history/:gameId", verifyToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Find the game history entry
    const gameHistory = await GameHistory.findById(gameId);
    if (!gameHistory) {
      return res.status(404).json({ message: "Game history not found" });
    }
    
    // Find the child to verify ownership
    const child = await Child.findById(gameHistory.childId);
    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }
    
    // Verify that the child belongs to the authenticated user
    if (child.parentId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized: Game history does not belong to this user's child" });
    }
    
    // Remove the game history reference from the child
    await Child.findByIdAndUpdate(
      gameHistory.childId,
      { $pull: { gameHistory: gameId } }
    );
    
    // Delete the game history entry
    await GameHistory.findByIdAndDelete(gameId);
    
    res.json({ message: "Game history deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting game history", error: error.message });
  }
});

// Add these routes to your server/index.js file

// Get all clients (for admin use only)
app.get("/clients", verifyToken, async (req, res) => {
  try {
    // Check if the user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }
    
    // Fetch all clients
    const clients = await Client.find({}, { password: 0 }); // Exclude password field
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: "Error fetching clients", error: error.message });
  }
});

// Get a specific client with their children (for admin use only)
app.get("/clients/:clientId/children", verifyToken, async (req, res) => {
  try {
    // Check if the user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }
    
    const { clientId } = req.params;
    
    // Find the client by ID
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    // Find all children of this client
    const children = await Child.find({ parentId: clientId });
    
    // Fetch game histories for each child
    const childrenWithHistory = await Promise.all(children.map(async (child) => {
      const gameHistory = await GameHistory.find({ childId: child._id });
      
      // Convert Mongoose document to plain object and add game history
      const childObj = child.toObject();
      childObj.gameHistory = gameHistory;
      
      return childObj;
    }));
    
    res.json(childrenWithHistory);
  } catch (error) {
    res.status(500).json({ message: "Error fetching client children", error: error.message });
  }
});

// Fix the existing delete route - it was using "clients" in URL but "students" in the function
app.delete("/clients/:id", verifyToken, async (req, res) => {
  try {
    // Check if the user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }
    
    const { id } = req.params;
    await Client.findByIdAndDelete(id);
    
    // Also delete all children and their game histories
    const children = await Child.find({ parentId: id });
    
    // Delete game histories for each child
    for (const child of children) {
      await GameHistory.deleteMany({ childId: child._id });
    }
    
    // Delete all children
    await Child.deleteMany({ parentId: id });
    
    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting client", error: error.message });
  }
});

// Message Schema
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isAdmin: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
});
const Message = mongoose.model("Message", messageSchema);

// Send a message
// app.post("/messages", verifyToken, async (req, res) => {
//   try {
//     const { receiverId, content } = req.body;
    
//     const message = new Message({
//       senderId: req.user.id,
//       receiverId,
//       content,
//       isAdmin: req.user.isAdmin,
//       timestamp: Date.now(),
//     });
    
//     await message.save();
    
//     res.status(201).json(message);
//   } catch (error) {
//     res.status(500).json({ message: "Error sending message", error: error.message });
//   }
// });

// Get messages between admin and client
app.get("/messages/:clientId", verifyToken, async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Find messages where either the admin is sending to the client or the client is sending to the admin
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: clientId },
        { senderId: clientId, receiverId: req.user.id }
      ]
    }).sort({ timestamp: 1 });
    
    // For each message, add the sender's name
    const messagesWithNames = await Promise.all(messages.map(async (message) => {
      const messageObj = message.toObject();
      
      if (message.isAdmin) {
        messageObj.senderName = "Admin";
      } else {
        // Find the client's name
        const client = await Client.findById(message.senderId);
        messageObj.senderName = client ? client.name : "Unknown Client";
      }
      
      return messageObj;
    }));
    
    res.json(messagesWithNames);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error: error.message });
  }
});

// Mark messages as read
app.put("/messages/read/:senderId", verifyToken, async (req, res) => {
  try {
    const { senderId } = req.params;
    
    await Message.updateMany(
      { senderId, receiverId: req.user.id, isRead: false },
      { isRead: true }
    );
    
    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error marking messages as read", error: error.message });
  }
});

// Get unread message count for a user
app.get("/messages/unread/count", verifyToken, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user.id,
      isRead: false
    });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching unread message count", error: error.message });
  }
});
// ========================
// Server Setup
// =======================


// 1. Fix the message endpoint typo (change "messagess" to "messages")
app.post("/messages", verifyToken, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    
    // Handle the special case for "admin" string identifier
    let actualReceiverId = receiverId;
    
    // If receiverId is "admin", find the actual admin user ID
    if (receiverId === "admin") {
      const adminUser = await Admin.findOne({});
      if (!adminUser) {
        return res.status(404).json({ message: "Admin user not found" });
      }
      actualReceiverId = adminUser._id;
    }
    
    const message = new Message({
      senderId: req.user.id,
      receiverId: actualReceiverId,
      content,
      isAdmin: req.user.isAdmin,
      timestamp: Date.now(),
    });
    
    await message.save();
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: "Error sending message", error: error.message });
  }
});

// 2. Fix the admin messages endpoint
app.get("/messages/admin", verifyToken, async (req, res) => {
  try {
    // Find admin user
    const admin = await Admin.findOne({});
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    // Convert ObjectId to string for comparison
    const adminId = admin._id.toString();
    const userId = req.user.id.toString();
    
    // Find messages between client and admin
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: adminId },
        { senderId: adminId, receiverId: userId }
      ]
    }).sort({ timestamp: 1 });
    
    // For each message, add sender info
    const messagesWithInfo = messages.map(message => {
      const messageObj = message.toObject();
      
      // Check if sender is admin
      messageObj.isAdmin = message.senderId.toString() === adminId;
      messageObj.senderName = messageObj.isAdmin ? "Admin" : "You";
      
      return messageObj;
    });
    
    res.json(messagesWithInfo);
  } catch (error) {
    console.error("Error in /messages/admin:", error);
    res.status(500).json({ message: "Error fetching messages", error: error.message });
  }
});

// 3. Enhanced error handling for the mark-as-read endpoint
app.put("/messages/read/admin", verifyToken, async (req, res) => {
  try {
    // Find admin user
    const admin = await User.findOne({ isAdmin: true });
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    // Mark messages from admin as read
    const result = await Message.updateMany(
      { senderId: admin._id, receiverId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.json({ 
      message: "Messages marked as read",
      updated: result.modifiedCount
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Error marking messages as read", error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));