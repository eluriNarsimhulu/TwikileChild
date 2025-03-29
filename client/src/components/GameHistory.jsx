import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Clock, Star, Calendar } from 'lucide-react';

const GameHistory = ({ children, onClose }) => {
  const [selectedChild, setSelectedChild] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

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

  return (
    <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-4xl mx-auto">
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
          
          {children.length === 0 ? (
            <p className="text-gray-500">No children found</p>
          ) : (
            <div className="space-y-2">
              {children.map((child) => (
                <button
                  key={child._id}
                  onClick={() => handleChildSelect(child)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedChild && selectedChild._id === child._id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  <div className="font-medium">{child.name}</div>
                  <div className="text-sm opacity-80">Age: {child.age}</div>
                </button>
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
                  className="bg-white shadow p-4 rounded-lg"
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
                  <div className="flex items-center text-gray-600">
                    <Clock size={18} className="mr-2" />
                    Duration: {calculateDuration(game.startTime, game.endTime)} seconds
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