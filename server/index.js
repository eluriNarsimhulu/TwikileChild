const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// const mongoUrl = 'mongodb+srv://social_media_admin:admin123@cluster0.gazju.mongodb.net/management_s?retryWrites=true&w=majority&appName=Cluster0'; 
  const mongoUrl = 'mongodb://localhost:27017/management_s';
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

// Admin Schema
const adminSchema = new mongoose.Schema({
  email: String,
  password: String,
});
const Admin = mongoose.model("Admin", adminSchema);

// Student Schema
const studentSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const Student = mongoose.model("Student", studentSchema);

// Dummy Admin Data
const createDummyAdmin = async () => {
  const adminExists = await Admin.findOne({ email: "admin@example.com" });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await Admin.create({ email: "admin@example.com", password: hashedPassword });
    console.log("Dummy Admin Created");
  }
};
createDummyAdmin();

// Student Signup
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  const existingStudent = await Student.findOne({ email });
  if (existingStudent) return res.status(400).json({ message: "Student already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newStudent = new Student({ name, email, password: hashedPassword });
  await newStudent.save();
  res.json({ message: "Student signed up successfully" });
});

// Login (Admin or Student based on Checkbox)
app.post("/login", async (req, res) => {
  const { email, password, isAdmin } = req.body;
  const Model = isAdmin ? Admin : Student;

  const user = await Model.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ email: user.email, isAdmin }, "secretkey", { expiresIn: "1h" });
  res.json({ message: "Login successful", token });
});

// Get all students
app.get("/students", async (req, res) => {
    const students = await Student.find();
    res.json(students);
  });
  
  // Add a new student
  app.post("/students", async (req, res) => {
    const { name, email } = req.body;
    const newStudent = new Student({ name, email });
    await newStudent.save();
    res.json(newStudent);
  });
  
  // Delete a student
  app.delete("/students/:id", async (req, res) => {
    const { id } = req.params;
    await Student.findByIdAndDelete(id);
    res.json({ message: "Student deleted successfully" });
  });
  


app.listen(5000, () => console.log("Server running on port 5000"));
