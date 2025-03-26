import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import Login from "./components/Login";
import Signup from "./components/Signup";
import AdminPanel from './components/AdminPanel';
import StudentPanel from './components/StudentPanel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/student-panel" element={<StudentPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
