import { useEffect, useState } from "react";
import axios from "axios";
import React from "react";

function StudentPanel() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/students");
        setStudents(res.data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Student Management System</h1>

      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">Student Panel</h2>
        <h3 className="text-lg font-medium text-gray-600 mb-4">List of Students</h3>

        {students.length === 0 ? (
          <p className="text-gray-500 text-center">No students found.</p>
        ) : (
          <ul className="space-y-3">
            {students.map((student) => (
              <li
                key={student._id}
                className="bg-green-100 text-gray-700 px-4 py-2 rounded-lg shadow-sm flex justify-between items-center"
              >
                <span className="font-medium">{student.name}</span>
                <span className="text-gray-500">{student.email}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default StudentPanel;
