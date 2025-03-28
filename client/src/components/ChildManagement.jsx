import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Users } from 'lucide-react';

const ChildManagement = ({ onChildSelect, onClose }) => {
  const [children, setChildren] = useState([]);
  const [newChild, setNewChild] = useState({ name: '', age: '' });
  const token = localStorage.getItem('token');

  // Fetch children when component mounts
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await axios.get('http://localhost:5000/children', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChildren(res.data);
      } catch (error) {
        console.error('Error fetching children:', error);
      }
    };
    fetchChildren();
  }, [token]);

  // Add a new child
  const handleAddChild = async () => {
    if (!newChild.name || !newChild.age) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/children', newChild, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChildren([...children, res.data]);
      setNewChild({ name: '', age: '' });
    } catch (error) {
      alert('Failed to add child');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Users className="mr-2 text-blue-500" /> Select or Add a Child
        </h2>

        {/* Add Child Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Child</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Child Name"
              value={newChild.name}
              onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Age"
              value={newChild.age}
              onChange={(e) => setNewChild({ ...newChild, age: e.target.value })}
              className="w-24 px-3 py-2 border rounded-lg"
            />
            <button 
              onClick={handleAddChild}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Child List Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Select a Child</h3>
          {children.length === 0 ? (
            <p className="text-gray-500 text-center">No children added yet</p>
          ) : (
            <div className="space-y-2">
              {children.map((child) => (
                <button
                  key={child._id}
                  onClick={() => onChildSelect(child)}
                  className="w-full bg-blue-100 text-blue-800 px-4 py-3 rounded-lg hover:bg-blue-200 flex justify-between items-center"
                >
                  <span className="font-medium">{child.name}</span>
                  <span className="text-sm text-blue-600">Age: {child.age}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildManagement;