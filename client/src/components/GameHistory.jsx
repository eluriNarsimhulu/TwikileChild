import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Clock, Star, Calendar, Trash2, AlertTriangle } from 'lucide-react';

const GameHistory = ({ children, onClose }) => {
  const [selectedChild, setSelectedChild] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, childId: null });
  const token = localStorage.getItem('token');

  // Ensure children is always an array
  const childrenArray = Array.isArray(children) ? children : [];

  // Fetch game history for a specific child
  const fetchGameHistory = async (childId) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/game-history/${childId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGameHistory(res.data);
    } catch (error) {
      console.error('Error fetching game history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch children list (if a child is deleted)
  const fetchChildren = async () => {
    try {
      const res = await axios.get('http://localhost:5000/children', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update the children list
      // Note: This requires the parent component to update its state
      if (typeof onClose === 'function') {
        onClose(res.data);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  // Handle child selection
  const handleChildSelect = (child) => {
    setSelectedChild(child);
    fetchGameHistory(child._id);
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Calculate game duration in seconds
  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    return Math.round(durationMs / 1000);
  };

  // Show confirmation dialog for child deletion
  const showDeleteConfirmation = (childId) => {
    setDeleteConfirm({ show: true, childId });
  };

  // Cancel delete operation
  const cancelDelete = () => {
    setDeleteConfirm({ show: false, childId: null });
  };

  // Handle delete game history (without confirmation)
  const handleDeleteGame = async (gameId) => {
    try {
      await axios.delete(`http://localhost:5000/game-history/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the game history list
      setGameHistory(gameHistory.filter(game => game._id !== gameId));
    } catch (error) {
      console.error('Error deleting game history:', error);
    }
  };

  // Handle delete child
  const handleDeleteChild = async (childId) => {
    try {
      await axios.delete(`http://localhost:5000/children/${childId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Clear the selected child if it was deleted
      if (selectedChild && selectedChild._id === childId) {
        setSelectedChild(null);
        setGameHistory([]);
      }
      
      // Refresh the children list
      fetchChildren();
      setDeleteConfirm({ show: false, childId: null });
    } catch (error) {
      console.error('Error deleting child:', error);
    }
  };

  // Render confirmation dialog for child deletion
  const renderConfirmationDialog = () => {
    if (!deleteConfirm.show) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center text-red-600 mb-4">
            <AlertTriangle size={24} className="mr-2" />
            <h3 className="text-xl font-bold">Delete Child</h3>
          </div>
          
          <p className="mb-6">
            Are you sure you want to delete this child? This will also delete all their game history and cannot be undone.
          </p>
          
          <div className="flex justify-end space-x-4">
            <button 
              onClick={cancelDelete}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleDeleteChild(deleteConfirm.childId)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-4xl mx-auto">
      {renderConfirmationDialog()}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-purple-600">Children & Game History</h2>
        <button 
          onClick={onClose}
          className="text-gray-600 hover:text-gray-900"
        >
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Children List */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-blue-600">Select a Child</h3>
          
          {childrenArray.length === 0 ? (
            <p className="text-gray-500">No children found</p>
          ) : (
            <div className="space-y-2">
              {childrenArray.map((child) => (
                <div key={child._id} className="relative">
                  <button
                    onClick={() => handleChildSelect(child)}
                    className={`w-full text-left p-3 pr-10 rounded-lg transition-all ${
                      selectedChild && selectedChild._id === child._id
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-blue-800 hover:bg-blue-100'
                    }`}
                  >
                    <div className="font-medium">{child.name}</div>
                    <div className="text-sm opacity-80">Age: {child.age}</div>
                  </button>
                  <button 
                    onClick={() => showDeleteConfirmation(child._id)}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full 
                      ${selectedChild && selectedChild._id === child._id 
                        ? 'text-white hover:bg-blue-600' 
                        : 'text-red-500 hover:bg-red-100'}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Game History */}
        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-blue-600">
            {selectedChild ? `${selectedChild.name}'s Game History` : 'Game History'}
          </h3>
          
          {!selectedChild ? (
            <p className="text-gray-500">Please select a child to view game history</p>
          ) : loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : gameHistory.length === 0 ? (
            <p className="text-gray-500">No game history found</p>
          ) : (
            <div className="space-y-4">
              {gameHistory.map((game) => (
                <div 
                  key={game._id} 
                  className="bg-white shadow p-4 rounded-lg relative"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center text-blue-600">
                      <Calendar size={18} className="mr-2" />
                      {formatDateTime(game.startTime)}
                    </div>
                    <div className="flex items-center text-green-600">
                      <Star size={18} className="mr-2" />
                      Score: {game.score}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <div className="flex items-center">
                      <Clock size={18} className="mr-2" />
                      Duration: {calculateDuration(game.startTime, game.endTime)} seconds
                    </div>
                    <button 
                      onClick={() => handleDeleteGame(game._id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHistory;