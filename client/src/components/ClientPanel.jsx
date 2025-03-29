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
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const gameInProgressRef = useRef(false); // Track if game is actually in progress

  // Fetch children when component mounts
  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await axios.get('http://localhost:5000/children', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChildren(res.data);
      
      // If there's at least one child and none is selected, select the first one
      if (res.data.length > 0 && !selectedChild) {
        setSelectedChild(res.data[0]);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
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
    
    // Track start time - only when game is actually starting
    startTimeRef.current = new Date();
    gameInProgressRef.current = true; // Set game in progress flag
    
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
    // Only record game history if a game was actually in progress
    if (gameInProgressRef.current && selectedChild) {
      clearInterval(timerRef.current);
      setGameStatus('finished');
      
      // Calculate end time
      const endTime = new Date();
      
      // Only record game history if the game actually started and there was a score
      recordGameHistory(startTimeRef.current, endTime);
      
      // Update high score
      setHighScore(prevHighScore => Math.max(prevHighScore, score));
      
      // Reset the game in progress flag
      gameInProgressRef.current = false;
    }
  };

  // Record game history to backend
  const recordGameHistory = async (startTime, endTime) => {
    if (!selectedChild || !startTime || !endTime || score === 0) return;

    try {
      const token = localStorage.getItem('token');
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
            onClose={() => setShowGameHistory(false)}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPanel;