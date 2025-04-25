import React, { useState } from 'react';
import MonthlyActivityChart from './MonthlyActivityChart';
import ScoreDistributionChart from './ScoreDistributionChart';
import AverageScoreChart from './AverageScoreChart';
import GameDurationChart from './GameDurationChart';

function ClientInsightsCharts({ childrenData }) {
  const [activeChart, setActiveChart] = useState('monthly');

  if (!childrenData || childrenData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="text-center py-12 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 13v-1m4 1v-3m4 3V8M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">No Data Available</h3>
          <p>Select a client with children data to view insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg mb-6 transition-all duration-300 transform hover:shadow-xl">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-gray-800">Performance Insights</h3>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveChart('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeChart === 'monthly'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setActiveChart('scores')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeChart === 'scores'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Scores
            </button>
            <button
              onClick={() => setActiveChart('age')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeChart === 'age'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              By Age
            </button>
            <button
              onClick={() => setActiveChart('duration')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeChart === 'duration'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Duration
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {activeChart === 'monthly' && 'Game activity over the last 6 months'}
          {activeChart === 'scores' && 'Distribution of game scores by performance range'}
          {activeChart === 'age' && 'Average scores by age group'}
          {activeChart === 'duration' && 'Game session duration analysis'}
        </p>
      </div>

      <div className="p-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg">
          {activeChart === 'monthly' && <MonthlyActivityChart childrenData={childrenData} />}
          {activeChart === 'scores' && <ScoreDistributionChart childrenData={childrenData} />}
          {activeChart === 'age' && <AverageScoreChart childrenData={childrenData} />}
          {activeChart === 'duration' && <GameDurationChart childrenData={childrenData} />}
        </div>
      </div>
      
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Based on {getTotalGames(childrenData)} games played</span>
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

// Helper function to count total games
function getTotalGames(childrenData) {
  if (!childrenData) return 0;
  
  let totalGames = 0;
  childrenData.forEach(child => {
    if (child.gameHistory) {
      totalGames += child.gameHistory.length;
    }
  });
  
  return totalGames;
}

export default ClientInsightsCharts;