import { useEffect, useState } from "react";
import axios from "axios";
import React from "react";
import ChatBox from "./ChatBox";
import API_BASE_URL from '../../config/api.js';
import ClientInsightsCharts from "./charts/ClientInsightsCharts";

function AdminPanel() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [childrenData, setChildrenData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("children");
  const [clientStats, setClientStats] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Set up axios interceptor for token expiration
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );

    fetchClients();
    
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(res.data);
      
      // Generate summary stats for all clients
      const stats = {};
      res.data.forEach(client => {
        stats[client._id] = {
          totalChildren: 0,
          totalGames: 0,
          avgScore: 0,
          lastActive: null
        };
      });
      setClientStats(stats);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Failed to load clients. Please try again.");
      setLoading(false);
    }
  };

  const fetchClientChildren = async (clientId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/clients/${clientId}/children`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Store children data
      setChildrenData(prev => ({
        ...prev,
        [clientId]: res.data
      }));
      
      // Update client stats
      const childrenCount = res.data.length;
      let totalGames = 0;
      let totalScore = 0;
      let latestActivity = null;
      
      res.data.forEach(child => {
        if (child.gameHistory && child.gameHistory.length > 0) {
          totalGames += child.gameHistory.length;
          
          // Calculate total score
          child.gameHistory.forEach(game => {
            totalScore += game.score;
            
            // Find the most recent activity
            const gameDate = new Date(game.endTime);
            if (!latestActivity || gameDate > latestActivity) {
              latestActivity = gameDate;
            }
          });
        }
      });
      
      // Update stats for this client
      setClientStats(prev => ({
        ...prev,
        [clientId]: {
          totalChildren: childrenCount,
          totalGames: totalGames,
          avgScore: totalGames > 0 ? Math.round(totalScore / totalGames) : 0,
          lastActive: latestActivity
        }
      }));
      
    } catch (error) {
      console.error(`Error fetching children for client ${clientId}:`, error);
    }
  };

  const selectClient = (clientId) => {
    setSelectedClient(clientId);
    
    // Fetch children data if we don't have it yet
    if (!childrenData[clientId]) {
      fetchClientChildren(clientId);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPerformanceColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center transition-all duration-300 transform hover:scale-105"
            >
              Logout
            </button>
          </div>
        </header>
        <div className="container mx-auto p-6 flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <div className="text-xl text-gray-700">Loading client data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold mb-2 sm:mb-0">Client Management System</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/20 border border-white/30 rounded-lg py-1 px-3 pl-8 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2 top-2 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg flex items-center transition-all duration-300 transform hover:scale-105"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 flex-1">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 shadow-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={fetchClients}
                  className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-1 px-2 rounded-md text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Client List */}
          <div className="w-full lg:w-1/3 flex flex-col">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg flex-1">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
                <h3 className="font-semibold text-lg">Clients</h3>
                <p className="text-sm text-blue-100">Total: {clients.length}</p>
              </div>
              
              <div className="divide-y max-h-[calc(100vh-200px)] overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="p-6 text-gray-500 italic text-center">No clients found matching your search.</div>
                ) : (
                  filteredClients.map((client) => (
                    <div 
                      key={client._id} 
                      className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors duration-200 ${
                        selectedClient === client._id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => selectClient(client._id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-lg">{client.name}</h4>
                          <p className="text-sm text-gray-600">{client.email}</p>
                          <p className="text-sm text-gray-600">{client.mobileNumber}</p>
                        </div>
                        <div className="bg-blue-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                          {clientStats[client._id]?.totalChildren || 0}
                        </div>
                      </div>
                      
                      {/* Mini Stats for client */}
                      {clientStats[client._id]?.totalGames > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-100 p-2 rounded-lg">
                            <p className="font-semibold">Games Played</p>
                            <p className="text-blue-700">{clientStats[client._id]?.totalGames}</p>
                          </div>
                          <div className="bg-gray-100 p-2 rounded-lg">
                            <p className="font-semibold">Avg Score</p>
                            <p className={getPerformanceColor(clientStats[client._id]?.avgScore)}>
                              {clientStats[client._id]?.avgScore}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Right Column - Children Details and Chat */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg h-full">
              {/* Tabs for switching between Children and Chat */}
              <div className="bg-white p-1 flex border-b sticky top-0">
                <button
                  className={`px-4 py-2 rounded-t-lg mr-2 font-medium transition-colors duration-200 ${
                    activeTab === "children"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => setActiveTab("children")}
                >
                  Children
                </button>
                <button
                  className={`px-4 py-2 rounded-t-lg font-medium transition-colors duration-200 ${
                    activeTab === "chat"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => setActiveTab("chat")}
                >
                  Chat
                </button>
              </div>

              {/* Content based on active tab */}
              {activeTab === "children" ? (
                <div className="p-6 max-h-[calc(100vh-220px)] overflow-y-auto">
                  {!selectedClient ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        <p className="mt-2 text-lg">Select a client from the list to view details</p>
                        <p className="text-sm text-gray-400">Client information will appear here</p>
                      </div>
                    </div>
                  ) : !childrenData[selectedClient] ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p>Loading children data...</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Client Stats Summary */}
                      <div className="mb-8">
                        <h3 className="font-semibold text-xl mb-4 text-gray-800 border-b pb-2">
                          {clients.find(c => c._id === selectedClient)?.name} - Overview
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-md transform transition-transform hover:scale-105">
                            <p className="text-blue-100 text-sm">Total Children</p>
                            <p className="text-3xl font-bold">{clientStats[selectedClient]?.totalChildren || 0}</p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-md transform transition-transform hover:scale-105">
                            <p className="text-purple-100 text-sm">Total Games</p>
                            <p className="text-3xl font-bold">{clientStats[selectedClient]?.totalGames || 0}</p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-md transform transition-transform hover:scale-105">
                            <p className="text-green-100 text-sm">Average Score</p>
                            <p className="text-3xl font-bold">{clientStats[selectedClient]?.avgScore || 0}</p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-md transform transition-transform hover:scale-105">
                            <p className="text-amber-100 text-sm">Last Activity</p>
                            <p className="text-xl font-bold">
                              {clientStats[selectedClient]?.lastActive 
                                ? new Date(clientStats[selectedClient].lastActive).toLocaleDateString() 
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Charts Section */}
                      {childrenData[selectedClient] && childrenData[selectedClient].length > 0 && (
                        <ClientInsightsCharts childrenData={childrenData[selectedClient]} />
                      )}
                    
                      {childrenData[selectedClient].length === 0 ? (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-yellow-700 rounded-lg">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm">No children found for this client.</p>
                              <p className="text-xs mt-1">Consider adding children to track their game progress.</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-semibold text-xl mb-4 text-gray-800 border-b pb-2">Children</h3>
                          <div className="space-y-6">
                            {childrenData[selectedClient].map((child) => (
                              <div key={child._id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                                <div className="flex flex-wrap justify-between items-center mb-4">
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                                      {child.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <h4 className="text-lg font-medium">{child.name}</h4>
                                      <span className="text-sm text-gray-500">Age: {child.age}</span>
                                    </div>
                                  </div>
                                  
                                  {child.gameHistory && child.gameHistory.length > 0 && (
                                    <div className="mt-2 sm:mt-0 bg-blue-50 px-3 py-1 rounded-full text-blue-700 text-sm font-medium">
                                      Games: {child.gameHistory.length}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Game Stats Summary */}
                                {child.gameHistory && child.gameHistory.length > 0 && (
                                  <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <p className="text-xs text-gray-500">Average Score</p>
                                      <p className="text-lg font-semibold">
                                        {Math.round(child.gameHistory.reduce((sum, game) => sum + game.score, 0) / child.gameHistory.length)}
                                      </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <p className="text-xs text-gray-500">Best Score</p>
                                      <p className="text-lg font-semibold text-green-600">
                                        {Math.max(...child.gameHistory.map(game => game.score))}
                                      </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <p className="text-xs text-gray-500">Last Played</p>
                                      <p className="text-lg font-semibold">
                                        {new Date(child.gameHistory[child.gameHistory.length - 1].endTime).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Game history */}
                                <div className="mt-4">
                                  <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    Game History
                                  </h5>
                                  
                                  {child.gameHistory && child.gameHistory.length > 0 ? (
                                    <div className="overflow-x-auto max-h-60 overflow-y-auto rounded-lg border border-gray-200">
                                      <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100 sticky top-0">
                                          <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                          </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                          {child.gameHistory
                                            .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                                            .map((game) => {
                                              const startTime = new Date(game.startTime);
                                              const endTime = new Date(game.endTime);
                                              const duration = Math.round((endTime - startTime) / 1000);
                                              
                                              return (
                                                <tr key={game._id} className="hover:bg-gray-50">
                                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                    {startTime.toLocaleDateString()}
                                                  </td>
                                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                    {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                  </td>
                                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                    {duration} sec
                                                  </td>
                                                  <td className="px-3 py-2 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                      game.score >= 80 ? 'bg-green-100 text-green-800' :
                                                      game.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                      'bg-red-100 text-red-800'
                                                    }`}>
                                                      {game.score}
                                                    </span>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="text-gray-500 italic bg-gray-50 p-4 rounded-lg text-center">
                                      No game history available yet.
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[calc(100vh-220px)]">
                  <ChatBox selectedClient={selectedClient} />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminPanel;