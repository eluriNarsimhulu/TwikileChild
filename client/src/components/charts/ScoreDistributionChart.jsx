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

function ScoreDistributionChart({ childrenData }) {
  const chartData = useMemo(() => {
    if (!childrenData || !childrenData.length) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    // Score ranges
    const ranges = [
      { min: 0, max: 20, label: '0-20', count: 0, color: 'rgba(239, 68, 68, 0.7)' },
      { min: 21, max: 40, label: '21-40', count: 0, color: 'rgba(249, 115, 22, 0.7)' },
      { min: 41, max: 60, label: '41-60', count: 0, color: 'rgba(234, 179, 8, 0.7)' },
      { min: 61, max: 80, label: '61-80', count: 0, color: 'rgba(132, 204, 22, 0.7)' },
      { min: 81, max: 100, label: '81-100', count: 0, color: 'rgba(34, 197, 94, 0.7)' }
    ];
    
    // Count scores per range
    childrenData.forEach(child => {
      if (child.gameHistory && child.gameHistory.length > 0) {
        child.gameHistory.forEach(game => {
          const score = game.score;
          
          for (const range of ranges) {
            if (score >= range.min && score <= range.max) {
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
          label: 'Score Distribution',
          data: ranges.map(r => r.count),
          backgroundColor: ranges.map(r => r.color),
          borderColor: ranges.map(r => r.color.replace('0.7', '1')),
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: ranges.map(r => r.color.replace('0.7', '0.9')),
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
        display: false,
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
            return `${context.parsed.y} games (${context.label} score range)`;
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

export default ScoreDistributionChart;