import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function AverageScoreChart({ childrenData }) {
  const chartData = useMemo(() => {
    if (!childrenData || !childrenData.length) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    // Group children by age
    const ageGroups = {};
    
    childrenData.forEach(child => {
      if (child.gameHistory && child.gameHistory.length > 0) {
        const age = child.age;
        
        if (!ageGroups[age]) {
          ageGroups[age] = {
            totalScore: 0,
            totalGames: 0
          };
        }
        
        child.gameHistory.forEach(game => {
          ageGroups[age].totalScore += game.score;
          ageGroups[age].totalGames++;
        });
      }
    });
    
    // Calculate average scores
    const ages = Object.keys(ageGroups).sort((a, b) => a - b);
    const averageScores = ages.map(age => ({
      age,
      average: Math.round(ageGroups[age].totalScore / ageGroups[age].totalGames)
    }));
    
    return {
      labels: averageScores.map(item => `Age ${item.age}`),
      datasets: [
        {
          label: 'Average Score by Age',
          data: averageScores.map(item => item.average),
          borderColor: 'rgba(124, 58, 237, 1)',
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(124, 58, 237, 1)',
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.3
        }
      ]
    };
  }, [childrenData]);
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            family: 'Inter, sans-serif',
            size: 12
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        padding: 12,
        titleFont: {
          family: 'Inter, sans-serif',
          size: 14
        },
        bodyFont: {
          family: 'Inter, sans-serif',
          size: 13
        },
        cornerRadius: 6
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.15)'
        },
        ticks: {
          font: {
            family: 'Inter, sans-serif',
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Inter, sans-serif',
            size: 11
          }
        }
      }
    }
  };

  if (!childrenData || childrenData.length === 0 || !Object.keys(chartData.datasets[0]?.data || {}).length) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available for chart</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}

export default AverageScoreChart;