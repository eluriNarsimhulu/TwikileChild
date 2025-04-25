import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function GameDurationChart({ childrenData }) {
  const chartData = useMemo(() => {
    if (!childrenData || !childrenData.length) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    // Duration ranges (in seconds)
    const ranges = [
      { min: 0, max: 30, label: '<30 sec', count: 0 },
      { min: 30, max: 60, label: '30-60 sec', count: 0 },
      { min: 60, max: 120, label: '1-2 min', count: 0 },
      { min: 120, max: 300, label: '2-5 min', count: 0 },
      { min: 300, max: 600, label: '5-10 min', count: 0 },
      { min: 600, max: Number.MAX_SAFE_INTEGER, label: '>10 min', count: 0 }
    ];
    
    // Count games per duration range
    childrenData.forEach(child => {
      if (child.gameHistory && child.gameHistory.length > 0) {
        child.gameHistory.forEach(game => {
          const startTime = new Date(game.startTime);
          const endTime = new Date(game.endTime);
          const duration = Math.round((endTime - startTime) / 1000); // in seconds
          
          for (const range of ranges) {
            if (duration >= range.min && duration <= range.max) {
              range.count++;
              break;
            }
          }
        });
      }
    });
    
    return {
      labels: ranges.map(r => r.label),
      datasets: [
        {
          label: 'Game Duration',
          data: ranges.map(r => r.count),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(16, 185, 129, 0.9)',
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
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `${context.parsed.y} games (${context.label})`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.15)'
        },
        ticks: {
          precision: 0,
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

  if (!childrenData || childrenData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available for chart</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}

export default GameDurationChart;