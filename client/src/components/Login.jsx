import { useState } from "react";
import axios from "axios";
import React from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "react-lottie";
import login from "../assets/login.json";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Lottie animation options
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: login,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/login", {
        email,
        password,
        isAdmin,
      });
      
      // Store the token in localStorage
      localStorage.setItem('token', res.data.token);
      
      alert(res.data.message);
      if (res.data.token) {
        if (isAdmin) navigate("/admin-panel");
        else navigate("/client-panel");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left side - Animation */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-400 to-green-500 p-8 flex items-center justify-center">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white mb-6 text-center">Twinkle</h1>
            <div className="w-full">
              <Lottie options={defaultOptions} height={300} width="100%" />
            </div>
            <p className="text-white text-center mt-6 text-lg">Welcome back! We're glad to see you again.</p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full md:w-1/2 p-8">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Login to Your Account</h2>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative">
                <input
                  type="email"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 peer transition-all"
                />
                <label className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-500">
                  Email
                </label>
              </div>
              
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 peer transition-all"
                />
                <label className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-500">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L7.05 7.05m2.828 2.828l4.242 4.242M7.05 7.05l-.01-.01M21 21l-18-18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              <label className="flex items-center space-x-3 text-gray-700 pl-1">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={() => setIsAdmin(!isAdmin)}
                    className="h-5 w-5 opacity-0 absolute"
                    id="admin-checkbox"
                  />
                  <div className={`border-2 rounded w-5 h-5 flex flex-shrink-0 justify-center items-center mr-2 ${isAdmin ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                    <svg className={`fill-current w-3 h-3 text-white pointer-events-none ${isAdmin ? 'opacity-100' : 'opacity-0'}`} viewBox="0 0 20 20">
                      <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                    </svg>
                  </div>
                </div>
                <span className="select-none" onClick={() => setIsAdmin(!isAdmin)}>Login as Admin</span>
              </label>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 rounded-lg hover:from-blue-600 hover:to-green-600 transition duration-300 font-medium text-lg shadow-lg transform hover:-translate-y-1 mt-6"
              >
                Login
              </button>
            </form>
            
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
              </div>
            </div>
            
            <div className="text-center">
              <span
                onClick={() => navigate("/signup")}
                className="inline-block text-blue-600 cursor-pointer hover:underline font-medium text-lg"
              >
                Sign Up
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;