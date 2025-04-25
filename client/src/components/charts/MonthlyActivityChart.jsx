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

function MonthlyActivityChart({ childrenData }) {
  const chartData = useMemo(() => {
    if (!childrenData || !childrenData.length) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Get the last 6 months
    const months = [];
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"];
    
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(today.getMonth() - i);
      months.push({
        name: monthNames[date.getMonth()],
        year: date.getFullYear(),
        month: date.getMonth(),
        count: 0
      });
    }

    // Count games per month
    childrenData.forEach(child => {
      if (child.gameHistory && child.gameHistory.length > 0) {
        child.gameHistory.forEach(game => {
          const gameDate = new Date(game.startTime);
          
          months.forEach(month => {
            if (gameDate.getMonth() === month.month && gameDate.getFullYear() === month.year) {
              month.count++;
            }
          });
        });
      }
    });
    
    return {
      labels: months.map(m => `${m.name.substring(0, 3)} ${m.year}`),
      datasets: [
        {
          label: 'Games Played',
          data: months.map(m => m.count),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
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
        displayColors: false
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

export default MonthlyActivityChart;