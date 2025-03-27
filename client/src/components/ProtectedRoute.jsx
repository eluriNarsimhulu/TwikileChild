import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ isAdmin }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;

  // Decode the token payload (this is a simple method and might not be fully secure for production)
  const payload = JSON.parse(atob(token.split(".")[1]));

  if (isAdmin && !payload.isAdmin) {
    return <Navigate to="/client-panel" />;
  }
  if (!isAdmin && payload.isAdmin) {
    return <Navigate to="/admin-panel" />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
