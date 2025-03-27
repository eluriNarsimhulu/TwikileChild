import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import Login from "./components/Login";
import Signup from "./components/Signup";
import AdminPanel from './components/AdminPanel';
import ClientPanel from './components/ClientPanel';
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Protected route for Admin */}
        <Route element={<ProtectedRoute isAdmin={true} />}>
          <Route path="/admin-panel" element={<AdminPanel />} />
        </Route>

        {/* Protected route for Client */}
        <Route element={<ProtectedRoute isAdmin={false} />}>
          <Route path="/client-panel" element={<ClientPanel />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
