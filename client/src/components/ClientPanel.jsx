import React, { useState, useEffect, useRef } from 'react';
// In ClientPanel.jsx, add the Stop icon import
import { Play, Repeat, Target, Clock, Star, UserPlus, LogOut, Plus, Users, Award, Sparkles, Square } from 'lucide-react';
import axios from 'axios';
import GameHistory from './GameHistory';
import ClientChatBox from './ClientChatBox';

const ClientPanel = () => {
  const [tiles, setTiles] = useState(Array(16).fill('red'));
  const [currentGreenTile, setCurrentGreenTile] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600);
  const [gameStatus, setGameStatus] = useState('not-started');
  const [highScore, setHighScore] = useState(0);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showGameHistory, setShowGameHistory] = useState(false);
  const [children, setChildren] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newChild, setNewChild] = useState({ name: '', age: '' });
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const gameRecordedRef = useRef(false);
  const [isForwardStep, setIsForwardStep] = useState(true);
  

  // Set up axios interceptor to handle token expiration
  useEffect(() => {
    // Add request interceptor
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        // If we get a 401 error, the token might be invalid or expired
        if (error.response && error.response.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptor on component unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Fetch children when component mounts
  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        window.location.href = '/login';
        return;
      }
      
      const res = await axios.get('http://localhost:5000/children', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setChildren(res.data);
      
      // If there's at least one child and none is selected, select the first one
      if (res.data.length > 0 && !selectedChild) {
        setSelectedChild(res.data[0]);
      } else if (res.data.length === 0) {
        // If no children are left, clear the selected child
        setSelectedChild(null);
      } else if (selectedChild && !res.data.find(child => child._id === selectedChild._id)) {
        // If the selected child was deleted, select the first child
        setSelectedChild(res.data[0]);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      setError('Failed to load children. Please try again.');
      
      // Check if the error is due to authorization
      if (error.response && error.response.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login'; // Redirect to login page
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
      
      const res = await axios.post('http://localhost:5000/children', newChild, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the children list with the newly added child
      setChildren([...children, res.data]);
      
      // Reset the form
      setNewChild({ name: '', age: '' });
      setLoading(false);
      
      // If this is the first child, auto-select it
      if (children.length === 0) {
        setSelectedChild(res.data);
      }
    } catch (error) {
      console.error('Failed to add child:', error);
      setError('Failed to add child. Please try again.');
      setLoading(false);
    }
  };
  // Replace your existing selectRandomGreenTile function with this
const selectNextGreenTile = () => {
  if (currentGreenTile === null) {
    // For first tile selection or reset, pick a starting point
    const firstTile = Math.floor(Math.random() * 16);
    const newTiles = [...tiles].fill('red');
    newTiles[firstTile] = 'green';
    setTiles(newTiles);
    setCurrentGreenTile(firstTile);
    return;
  }
  
  // Use algorithm to determine next tile
  const { nextTile, isForward } = recommendAlternateTile(currentGreenTile, isForwardStep);
  
  // Update direction state
  setIsForwardStep(isForward);
  
  // Update tiles
  const newTiles = [...tiles].fill('red');
  newTiles[nextTile] = 'green';
  setTiles(newTiles);
  setCurrentGreenTile(nextTile);
};
  
  // Handle tile click
  // Update handleTileClick to use the new logic
const handleTileClick = (index) => {
  if (gameStatus !== 'playing') return;

  const newTiles = [...tiles];
  if (index === currentGreenTile) {
    // Correct tile clicked
    setScore(prevScore => {
      const newScore = prevScore + 1;
      // Add some excitement for consecutive correct clicks
      if (newScore % 5 === 0) {
        // Briefly flash all tiles yellow on milestone
        newTiles.fill('milestone');
        setTiles(newTiles);
        
        // Use a setTimeout to select next green tile
        setTimeout(() => {
          selectNextGreenTile();
        }, 300);
        
        return newScore;
      }
      
      // Normal gameplay
      selectNextGreenTile();
      return newScore;
    });
  } else {
    // Incorrect tile clicked
    newTiles[index] = 'wrong';
    setTiles(newTiles);
    setTimeout(() => {
      selectNextGreenTile(); // Select next green tile
    }, 300);
  }
};
// Add this function to your ClientPanel component
const recommendAlternateTile = (selectedTile, forwardStep = true) => {
  // Convert from zero-index to 1-index for algorithm
  const tileNumber = selectedTile + 1;
  
  const forwardStepping = (tile) => {
    if (tile < 1 || tile > 16) {
      console.error("Invalid tile selection");
      return { nextTile: Math.floor(Math.random() * 16), isForward: forwardStep };
    }

    // Check if we're at the bottom row and need to change direction
    if (tile >= 13 && tile <= 16) {
      console.log("Turn Around and Walk in Reverse Way");
      return reverseStepping(tile);
    }

    let alternateTile;
    // For a 4x4 grid, move in a zigzag pattern
    // If in an odd row (1-4, 9-12), move right or down
    // If in an even row (5-8, 13-16), move left or down
    
    const row = Math.ceil(tile / 4);
    const colPosition = tile % 4 === 0 ? 4 : tile % 4;
    
    if (row % 2 === 1) { // Odd rows (1st and 3rd)
      if (colPosition === 4) { // At the end of odd row, move down
        alternateTile = tile + 4;
      } else { // Otherwise move right
        alternateTile = tile + 1;
      }
    } else { // Even rows (2nd and 4th)
      if (colPosition === 1) { // At the start of even row, move down
        alternateTile = tile + 4;
      } else { // Otherwise move left
        alternateTile = tile - 1;
      }
    }
    
    // Convert back to zero-index for the grid
    return { nextTile: alternateTile - 1, isForward: true };
  };

  const reverseStepping = (tile) => {
    if (tile < 1 || tile > 16) {
      console.error("Invalid tile selection");
      return { nextTile: Math.floor(Math.random() * 16), isForward: forwardStep };
    }

    // Check if we're at the top row and need to change direction
    if (tile >= 1 && tile <= 4) {
      console.log("Turn Around and Walk in Forward Way");
      return forwardStepping(tile);
    }

    let alternateTile;
    // For reverse movement in a 4x4 grid
    const row = Math.ceil(tile / 4);
    const colPosition = tile % 4 === 0 ? 4 : tile % 4;
    
    if (row % 2 === 0) { // Even rows (2nd and 4th) in reverse
      if (colPosition === 4) { // At the end of even row, move up
        alternateTile = tile - 4;
      } else { // Otherwise move right
        alternateTile = tile + 1;
      }
    } else { // Odd rows (1st and 3rd) in reverse
      if (colPosition === 1) { // At the start of odd row, move up
        alternateTile = tile - 4;
      } else { // Otherwise move left
        alternateTile = tile - 1;
      }
    }
    
    // Convert back to zero-index for the grid
    return { nextTile: alternateTile - 1, isForward: false };
  };

  return forwardStep ? forwardStepping(tileNumber) : reverseStepping(tileNumber);
};
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  // Update startGame function
const startGame = () => {
  if (!selectedChild) {
    setError('Please select a child to play');
    return;
  }

  // Reset game state
  const initialTiles = Array(16).fill('red');
  setTiles(initialTiles);
  setScore(0);
  setTimeLeft(600); // Set to 600 seconds for 10 minutes
  setGameStatus('playing');
  gameRecordedRef.current = false;
  setIsForwardStep(true); // Reset direction

  // Track start time
  startTimeRef.current = new Date();

  // First tile selection can still be random
  const firstGreenTile = Math.floor(Math.random() * 16);
  const newTiles = [...initialTiles];
  newTiles[firstGreenTile] = 'green';
  setTiles(newTiles);
  setCurrentGreenTile(firstGreenTile);

  // Clear any existing timer
  if (timerRef.current) clearInterval(timerRef.current);

  // Start timer immediately
  timerRef.current = setInterval(() => {
    setTimeLeft(prevTime => {
      if (prevTime <= 1) {
        clearInterval(timerRef.current);
        endGame();
        return 0;
      }
      return prevTime - 1;
    });
  }, 1000);
};
  const endGame = async () => {
    // Stop the timer immediately
    clearInterval(timerRef.current);
    
    // Calculate end time right away
    const endTime = new Date();
    
    // Record game history immediately
    if (!gameRecordedRef.current && selectedChild) {
      try {
        // Set flag first to prevent double-recording
        gameRecordedRef.current = true;
        
        console.log("Recording game history immediately...", {
          childId: selectedChild._id,
          startTime: startTimeRef.current,
          endTime: endTime,
          currentScore: score
        });
        
        const token = localStorage.getItem('token');
        if (!token) {
          console.error("No token found, cannot record game history");
          return;
        }
        
        // Make the API call directly in endGame to ensure it happens immediately
        await axios.post('http://localhost:5000/game-history', {
          childId: selectedChild._id,
          startTime: startTimeRef.current,
          endTime: endTime,
          score: score  // Use current score value
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Game history recorded successfully');
        alert('Game history saved successfully!'); // Notify user
      } catch (error) {
        console.error('Failed to record game history:', error);
        gameRecordedRef.current = false; // Reset flag so we can try again
      }
    }
    
    // Update game status AFTER recording history
    setGameStatus('finished');
    
    // Update high score
    setHighScore(prevHighScore => Math.max(prevHighScore, score));
  };

 // Record game history to backend with current score passed directly
const recordGameHistory = async (startTime, endTime) => {
  if (!selectedChild) return;

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      handleLogout();
      return;
    }
    
    // Use the current score value directly from state
    const currentScore = score;
    
    const response = await axios.post('http://localhost:5000/game-history', {
      childId: selectedChild._id,
      startTime,
      endTime,
      score: currentScore
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Game history recorded successfully:', response.data);
  } catch (error) {
    console.error('Failed to record game history:', error);
    // We don't want to interrupt gameplay for this error, so just log it
  }
};
  // Restart game
  const restartGame = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    startGame();
  };

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Render tile color and classes
  const getTileClass = (color) => {
    switch(color) {
      case 'red': return 'bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 shadow-lg transform hover:scale-105 text-white font-bold transition-all duration-200';
      case 'green': return 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg animate-pulse text-white font-bold transition-all duration-200';
      case 'wrong': return 'bg-gradient-to-br from-red-600 to-red-900 shadow-lg animate-shake text-white font-bold transition-all duration-200';
      case 'milestone': return 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg animate-bounce text-white font-bold transition-all duration-200';
      default: return 'bg-gradient-to-br from-red-400 to-red-600 shadow-lg text-white font-bold transition-all duration-200';
    }
  };

  // Handle child selection
  const handleChildSelect = (child) => {
    setSelectedChild(child);
    // Reset game state when changing children
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setGameStatus('not-started');
  };

  // Handle navigation to game history
  const handleGameHistoryClick = () => {
    setShowGameHistory(true);
  };

  // Handle game history close with optional updated children data
  const handleGameHistoryClose = (updatedChildren) => {
    setShowGameHistory(false);
    
    // If we received updated children data and it's an array, update our state
    if (updatedChildren && Array.isArray(updatedChildren)) {
      setChildren(updatedChildren);
      
      // Check if the selected child still exists
      if (selectedChild && !updatedChildren.find(child => child._id === selectedChild._id)) {
        // If selected child was deleted, select the first child or set to null
        setSelectedChild(updatedChildren.length > 0 ? updatedChildren[0] : null);
      }
    }
    
    // Refresh children to ensure we have the latest data
    fetchChildren();
  };

  // Check token existence and validity on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg p-4 border-b border-purple-100">
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo on left */}
          <div className="flex items-center">
            <img 
              src="https://res.cloudinary.com/dxhr35o8l/image/upload/v1744303318/7113770_we0ruy.jpg" 
              alt="Logo" 
              className="h-12 transform hover:scale-105 transition-transform duration-300" 
            />
            <span className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
              Tile Tap Pro
            </span>
          </div>

          {/* Navigation in middle */}
          <div className="flex items-center">
            <button 
              onClick={handleGameHistoryClick}
              className="text-gray-700 hover:text-blue-600 font-medium px-4 py-2 rounded-full hover:bg-blue-50 transition-all duration-300 flex items-center"
            >
              <Award size={18} className="mr-2 text-blue-500" />
              Game History Dashboard
            </button>
          </div>

          {/* Logout button on right */}
          <div className="flex items-center">
            <button 
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow flex">
        {/* Error Display */}
        {error && (
          <div className="fixed top-16 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg shadow-lg z-50 animate-fadeIn">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
                <button 
                  onClick={() => {
                    setError(null);
                    fetchChildren();
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="p-4 bg-white bg-opacity-80 rounded-full shadow-xl">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
            </div>
          </div>
        )}

        {/* Game History Component */}
        {showGameHistory ? (
          <div className="w-full p-4">
            <GameHistory 
              children={children}
              onClose={handleGameHistoryClose}
            />
          </div>
        ) : (
          <div className="flex w-full">
            {/* Left Sidebar - Child Management */}
            <div className="w-1/4 bg-white shadow-xl p-6 overflow-y-auto border-r border-purple-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
                  <Users className="mr-2 text-blue-500" /> Players
                </h2>
              </div>
              
              {/* Add Child Form */}
              <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-sm">
                <h3 className="text-sm font-semibold mb-3 text-blue-700 flex items-center">
                  <UserPlus size={16} className="mr-2" /> Add New Player
                </h3>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    placeholder="Child Name"
                    value={newChild.name}
                    onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    disabled={loading}
                  />
                </div>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Age"
                    value={newChild.age}
                    onChange={(e) => setNewChild({ ...newChild, age: e.target.value })}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    disabled={loading}
                  />
                  <button 
                    onClick={handleAddChild}
                    className={`${loading ? 'bg-gray-400' : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'} text-white px-4 py-2 rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300`}
                    disabled={loading}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              
              {/* Children List */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-700 flex items-center">
                  <Sparkles size={16} className="mr-2 text-yellow-500" /> Select a Player
                </h3>
                {loading ? (
                  <div className="text-gray-500 text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm">Loading players...</p>
                  </div>
                ) : children.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <p className="text-gray-500 text-sm">No players added yet</p>
                    <p className="text-gray-400 text-xs mt-2">Add a player using the form above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {children.map((child) => (
                      <button
                        key={child._id}
                        onClick={() => handleChildSelect(child)}
                        className={`w-full px-4 py-3 rounded-xl text-left flex justify-between items-center transition-all duration-300 shadow-sm hover:shadow-md ${
                          selectedChild && selectedChild._id === child._id 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                            : 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-800 hover:from-blue-100 hover:to-purple-100'
                        }`}
                        disabled={loading}
                      >
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            selectedChild && selectedChild._id === child._id 
                              ? 'bg-white bg-opacity-20' 
                              : 'bg-blue-100'
                          }`}>
                            {child.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{child.name}</span>
                        </div>
                        {/* Modified this span to always show with proper styling */}
                        <span className={`text-sm py-1 px-2 rounded-full ${
                          selectedChild && selectedChild._id === child._id 
                            ? 'bg-white bg-opacity-20' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          Age: {child.age}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Content - Game */}
            <div className="w-3/4 p-8 flex items-center justify-center bg-gradient-to-br from-white to-purple-50">
              {selectedChild ? (
                <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-2xl m-auto transform transition-all duration-500 hover:shadow-2xl border border-purple-100">
                  {/* Header with Selected Child */}
                  <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 text-center">
                      Tile Tap Challenge
                    </h1>
                    <p className="text-center text-xl mt-3 text-gray-600">
                      Playing as: <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">{selectedChild.name}</span>
                    </p>
                  </div>
                  
                  {/* Game Stats */}
                  <div className="flex justify-between mb-8 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-2xl shadow-inner">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-yellow-100 rounded-full">
                        <Star className="text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">High Score</p>
                        <span className="font-bold text-purple-600 text-lg">{highScore}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full ${timeLeft <= 3 && gameStatus === 'playing' ? 'bg-red-100' : 'bg-blue-100'}`}>
                        <Clock className={`${timeLeft <= 3 && gameStatus === 'playing' ? 'text-red-500 animate-ping' : 'text-blue-500'}`} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Time Left</p>
                        <span className={`font-bold text-lg ${timeLeft <= 3 && gameStatus === 'playing' ? 'text-red-600' : 'text-blue-600'}`}>
                          {formatTime(timeLeft)} mins
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Game Status & Controls */}
                  {gameStatus === 'not-started' && (
                    <div className="text-center mb-8">
                      <button 
                        onClick={startGame}
                        className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-4 rounded-full hover:from-purple-700 hover:to-blue-600 transition-all transform hover:scale-105 flex items-center justify-center mx-auto space-x-2 shadow-lg hover:shadow-xl"
                      >
                        <Play className="mr-2" size={20} /> Start Game
                      </button>
                      <p className="text-gray-500 text-sm mt-4">Tap the green tile as fast as you can!</p>
                    </div>
                  )}

                  {gameStatus === 'finished' && (
                    <div className="text-center mb-8">
                      <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-2xl mb-6 shadow-inner">
                        <h2 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-500">
                          Game Over!
                        </h2>
                        <div className="flex items-center justify-center">
                          <div className="p-3 bg-purple-100 rounded-full mr-3">
                            <Target className="text-purple-600" size={24} />
                          </div>
                          <p className="text-xl">Total Score: <span className="font-bold text-purple-600">{score}</span></p>
                        </div>
                      </div>
                      <button 
                        onClick={restartGame}
                        className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-4 rounded-full hover:from-green-600 hover:to-teal-600 transition-all transform hover:scale-105 flex items-center justify-center mx-auto space-x-2 shadow-lg hover:shadow-xl"
                      >
                        <Repeat className="mr-2" size={20} /> Play Again
                      </button>
                    </div>
                  )}

                  {/* Tile Grid - INCREASED SIZE */}
                  {gameStatus === 'playing' && (
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      {tiles.map((color, index) => (
                        <button
                          key={index}
                          onClick={() => handleTileClick(index)}
                          className={`h-24 w-full rounded-xl transition-all duration-300 ${getTileClass(color)} 
                            ${gameStatus !== 'playing' ? 'cursor-not-allowed' : 'cursor-pointer'}
                            flex items-center justify-center`}
                          disabled={gameStatus !== 'playing'}
                        >
                          <span className="opacity-75 text-2xl">
                            {`${index + 1}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  
                  {gameStatus === 'playing' && (
                  <div className="flex flex-col space-y-4">
                    <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-inner">
                      <span className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 flex items-center justify-center">
                        <Target className="mr-3 text-green-500" /> Score: {score}
                      </span>
                    </div>
                    
                    {/* Stop Button */}
                    <button 
                      onClick={endGame}
                      className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-full hover:from-red-600 hover:to-pink-600 transition-all flex items-center justify-center mx-auto shadow-md hover:shadow-lg"
                    >
                      <Square className="mr-2" size={18} /> Stop Game
                    </button>
                  </div>
                )}
                </div>
              ) : (
                <div className="text-center p-10 bg-white rounded-2xl shadow-xl border border-purple-100 max-w-lg mx-auto">
                  <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserPlus size={40} className="text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Select a Player</h3>
                  <p className="text-gray-600 mb-3">Select a player from the list to start playing the Tile Tap Challenge</p>
                  <p className="text-gray-500 text-sm">If you don't have any players yet, add one using the form on the left</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <ClientChatBox />
    </div>
    
  );
};

export default ClientPanel;