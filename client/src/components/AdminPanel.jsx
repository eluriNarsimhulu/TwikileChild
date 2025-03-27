import { useEffect, useState } from "react";
import axios from "axios";
import React from "react";

function AdminPanel() {
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: "", email: "" });
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/students", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudents(res.data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, [token]);

  const addStudent = async () => {
    if (!newStudent.name || !newStudent.email) {
      alert("Please fill in all fields");
      return;
    }
    try {
      const res = await axios.post("http://localhost:5000/students", newStudent, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents([...students, res.data]);
      setNewStudent({ name: "", email: "" });
    } catch (error) {
      alert("Failed to add student");
    }
  };

  const deleteStudent = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(students.filter((student) => student._id !== id));
    } catch (error) {
      alert("Failed to delete student");
    }
  };

  // Logout function and button
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Student Management System</h1>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-700 mb-4"
      >
        Logout
      </button>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">Admin Panel</h2>
        <h3 className="text-lg font-medium text-gray-600 mb-4">Add New Student</h3>
        <div className="flex flex-col space-y-3">
          <input
            type="text"
            placeholder="Student Name"
            value={newStudent.name}
            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Student Email"
            value={newStudent.email}
            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addStudent}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Add Student
          </button>
        </div>
        <h3 className="text-lg font-medium text-gray-600 mt-6 mb-4">Manage Students</h3>
        {students.length === 0 ? (
          <p className="text-gray-500 text-center">No students found.</p>
        ) : (
          <ul className="space-y-3">
            {students.map((student) => (
              <li
                key={student._id}
                className="bg-blue-100 text-gray-700 px-4 py-2 rounded-lg shadow-sm flex justify-between items-center"
              >
                <div>
                  <span className="font-medium">{student.name}</span>
                  <span className="block text-gray-500">{student.email}</span>
                </div>
                <button
                  onClick={() => deleteStudent(student._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
