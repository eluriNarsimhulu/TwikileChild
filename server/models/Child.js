const mongoose = require('mongoose');

// Game History Schema
const gameHistorySchema = new mongoose.Schema({
  childId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Child', 
    required: true 
  },
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date, 
    required: true 
  },
  score: { 
    type: Number, 
    required: true 
  },
  gameDate: { 
    type: Date, 
    default: Date.now 
  }
});

// Child Schema
const childSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true 
  },
  age: { 
    type: Number 
  },
  gameHistory: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'GameHistory' 
  }]
});

const GameHistory = mongoose.model('GameHistory', gameHistorySchema);
const Child = mongoose.model('Child', childSchema);

module.exports = { GameHistory, Child };