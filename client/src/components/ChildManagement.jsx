import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config/api.js';
import axios from 'axios';
import { X, Plus, Users } from 'lucide-react';

const ChildManagement = ({ onChildSelect, onClose }) => {
  const [children, setChildren] = useState([]);
  const [newChild, setNewChild] = useState({ name: '', age: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch children when component mounts
  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/children`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setChildren(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching children:', error);
      setError('Failed to load children. Please try again.');
      setLoading(false);
    }
  };

  // Add a new child
  const handleAddChild = async () => {
    if (!newChild.name || !newChild.age) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
        return;
      }

      const res = await axios.post(`${API_BASE_URL}/children`, newChild, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the children list with the newly added child
      setChildren([...children, res.data]);
      
      // Reset the form
      setNewChild({ name: '', age: '' });
      setLoading(false);
      
      // If this is the first child, auto-select it
      if (children.length === 0) {
        onChildSelect(res.data);
      }
    } catch (error) {
      console.error('Failed to add child:', error);
      setError('Failed to add child. Please try again.');
      setLoading(false);
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

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

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
              disabled={loading}
            />
            <input
              type="number"
              placeholder="Age"
              value={newChild.age}
              onChange={(e) => setNewChild({ ...newChild, age: e.target.value })}
              className="w-24 px-3 py-2 border rounded-lg"
              disabled={loading}
            />
            <button 
              onClick={handleAddChild}
              className={`${loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded-lg flex items-center`}
              disabled={loading}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Child List Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Select a Child</h3>
          {loading ? (
            <p className="text-gray-500 text-center">Loading children...</p>
          ) : children.length === 0 ? (
            <p className="text-gray-500 text-center">No children added yet</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {children.map((child) => (
                <button
                  key={child._id}
                  onClick={() => onChildSelect(child)}
                  className="w-full bg-blue-100 text-blue-800 px-4 py-3 rounded-lg hover:bg-blue-200 flex justify-between items-center"
                  disabled={loading}
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