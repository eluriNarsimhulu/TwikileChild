import React, { useState, useEffect, useRef } from 'react';
import { Play, Repeat, Target, Clock, Star, UserPlus, LogOut } from 'lucide-react';
import axios from 'axios';
import ChildManagement from './ChildManagement';
import GameHistory from './GameHistory';


const ClientPanel = () => {
  const [tiles, setTiles] = useState(Array(16).fill('red'));
  const [currentGreenTile, setCurrentGreenTile] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameStatus, setGameStatus] = useState('not-started');
  const [highScore, setHighScore] = useState(0);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showChildManagement, setShowChildManagement] = useState(false);
  const [showGameHistory, setShowGameHistory] = useState(false);
  const [children, setChildren] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const gameRecordedRef = useRef(false);


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

  // Randomly select a green tile
  const selectRandomGreenTile = () => {
    const availableTiles = tiles
      .map((color, index) => color === 'red' ? index : null)
      .filter(index => index !== null);
    
    if (availableTiles.length > 0) {
      const randomIndex = availableTiles[Math.floor(Math.random() * availableTiles.length)];
      const newTiles = [...tiles].fill('red'); // Reset all tiles to red first
      
      newTiles[randomIndex] = 'green';
      setTiles(newTiles);
      setCurrentGreenTile(randomIndex);
    }
  };

  // Handle tile click
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
          
          // Use a setTimeout to reset and select a new green tile
          setTimeout(() => {
            selectRandomGreenTile();
          }, 300);
          
          return newScore;
        }
        
        // Normal gameplay
        selectRandomGreenTile();
        return newScore;
      });
    } else {
      // Incorrect tile clicked
      newTiles[index] = 'wrong';
      setTiles(newTiles);
      setTimeout(() => {
        selectRandomGreenTile(); // Immediately select a new green tile
      }, 300);
    }
  };

  // Start game with child selection
  const startGame = () => {
    if (!selectedChild) {
      setShowChildManagement(true);
      return;
    }

    // Reset game state
    const initialTiles = Array(16).fill('red');
    setTiles(initialTiles);
    setScore(0);
    setTimeLeft(10);
    setGameStatus('playing');
    gameRecordedRef.current = false;
    
    // Track start time
    startTimeRef.current = new Date();
    
    // Select first green tile
    const firstGreenTile = Math.floor(Math.random() * 16);
    const newTiles = [...initialTiles];
    newTiles[firstGreenTile] = 'green';
    setTiles(newTiles);
    setCurrentGreenTile(firstGreenTile);

    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          endGame();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  // End game and record history
  const endGame = () => {
    clearInterval(timerRef.current);
    setGameStatus('finished');
    
    // Calculate end time
    const endTime = new Date();
    
    // Record game history only if it hasn't been recorded yet
    if (!gameRecordedRef.current && selectedChild) {
      recordGameHistory(startTimeRef.current, endTime);
      gameRecordedRef.current = true;
    }
    
    // Update high score
    setHighScore(prevHighScore => Math.max(prevHighScore, score));
  };

  // Record game history to backend
  const recordGameHistory = async (startTime, endTime) => {
    if (!selectedChild) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        handleLogout();
        return;
      }
      
      await axios.post('http://localhost:5000/game-history', {
        childId: selectedChild._id,
        startTime,
        endTime,
        score
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      case 'red': return 'bg-red-500 hover:bg-red-600 transform hover:scale-105';
      case 'green': return 'bg-green-500 animate-pulse';
      case 'wrong': return 'bg-red-700 animate-shake';
      case 'milestone': return 'bg-yellow-400 animate-bounce';
      default: return 'bg-red-500';
    }
  };

  // Handle child selection
  const handleChildSelect = (child) => {
    setSelectedChild(child);
    setShowChildManagement(false);
    
    // Refresh children list after selection to ensure we have the latest data
    fetchChildren();
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      {/* Navbar */}
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo on left */}
          <div className="flex items-center">
            <img 
              src="https://res.cloudinary.com/dxhr35o8l/image/upload/v1741375342/fuygxm2ntvzztldoyp66.png" 
              alt="Logo" 
              className="h-10" 
            />
          </div>

          {/* Navigation in middle */}
          <div className="flex items-center">
            <button 
              onClick={handleGameHistoryClick}
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Children & Their Game History
            </button>
          </div>

          {/* Logout button on right */}
          <div className="flex items-center">
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center p-4">
        {/* Error Display */}
        {error && (
          <div className="fixed top-16 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded shadow-md">
            <p>{error}</p>
            <button 
              onClick={() => {
                setError(null);
                fetchChildren();
              }}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Child Management Popup */}
        {showChildManagement && (
          <ChildManagement 
            onChildSelect={handleChildSelect}
            onClose={() => {
              setShowChildManagement(false);
              fetchChildren(); // Refresh the children list when closing
            }}
          />
        )}

        {/* Game History Component */}
        {showGameHistory ? (
          <GameHistory 
            children={children}
            onClose={handleGameHistoryClose}
          />
        ) : (
          <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md transform transition-all hover:scale-105">
            {/* Header with Child Selection */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
                Tile Tap Challenge
              </h1>
              <button 
                onClick={() => setShowChildManagement(true)}
                className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
              >
                <UserPlus size={20} />
              </button>
            </div>

            {/* Show selected child if available */}
            {selectedChild && (
              <div className="text-center mb-4">
                <p className="text-xl">
                  Playing as: <span className="font-bold text-purple-600">{selectedChild.name}</span>
                </p>
              </div>
            )}
            
            {/* Game Stats */}
            <div className="flex justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Star className="text-yellow-500" />
                <span className="font-bold text-purple-600">High Score: {highScore}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className={`${timeLeft <= 3 && gameStatus === 'playing' ? 'text-red-500 animate-ping' : 'text-blue-500'}`} />
                <span className={`font-bold ${timeLeft <= 3 && gameStatus === 'playing' ? 'text-red-600' : 'text-blue-600'}`}>
                  {timeLeft} sec
                </span>
              </div>
            </div>

            {/* Game Status & Controls */}
            {gameStatus === 'not-started' && (
              <div className="text-center mb-6">
                <button 
                  onClick={startGame}
                  className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-full hover:from-purple-700 hover:to-blue-600 transition-all transform hover:scale-110 flex items-center justify-center mx-auto space-x-2"
                >
                  <Play className="mr-2" /> Start Game
                </button>
                {!selectedChild && (
                  <p className="text-red-500 mt-2">Please select a child before starting the game.</p>
                )}
              </div>
            )}

            {gameStatus === 'finished' && (
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-500">
                  Game Over!
                </h2>
                <p className="text-xl mb-4">Total Score: <span className="font-bold text-purple-600">{score}</span></p>
                <button 
                  onClick={restartGame}
                  className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-full hover:from-green-600 hover:to-teal-600 transition-all transform hover:scale-110 flex items-center justify-center mx-auto space-x-2"
                >
                  <Repeat className="mr-2" /> Play Again
                </button>
              </div>
            )}

            {/* Tile Grid */}
            {gameStatus === 'playing' && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                {tiles.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => handleTileClick(index)}
                    className={`h-20 w-full rounded-lg transition-all duration-300 ${getTileClass(color)} 
                      ${gameStatus !== 'playing' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    disabled={gameStatus !== 'playing'}
                  >
                    {`t${index + 1}`}
                  </button>
                ))}
              </div>
            )}

            {/* Score Display */}
            {gameStatus === 'playing' && (
              <div className="text-center">
                <span className="font-bold text-xl text-purple-600 flex items-center justify-center">
                  <Target className="mr-2 text-green-500" /> Score: {score}
                </span>
              </div>
            )}
            
            {/* No Children Message */}
            {!loading && children.length === 0 && (
              <div className="text-center mt-4">
                <p className="text-red-500">No children found. Please add a child to play.</p>
                <button 
                  onClick={() => setShowChildManagement(true)}
                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Add Child
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPanel;