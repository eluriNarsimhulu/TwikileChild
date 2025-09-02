import React, { useState, useEffect, useRef } from "react";
import API_BASE_URL from '../../config/api.js';
import axios from "axios";

function ChatBox({ selectedClient }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (selectedClient) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedClient]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/messages/${selectedClient}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMessages(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setTyping(true);
      const res = await axios.post(
        `${API_BASE_URL}/messages`,
        {
          receiverId: selectedClient,
          content: newMessage
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMessages([...messages, res.data]);
      setNewMessage("");
      setTyping(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setTyping(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const groupMessagesByDate = () => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  if (!selectedClient) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl">
        <div className="text-center p-6 max-w-md">
          <div className="bg-blue-100 rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No conversation selected</h3>
          <p className="text-gray-600">Select a client from the list to start messaging</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate();

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden bg-white shadow-lg">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white font-medium mr-3">
            {messages.length > 0 && messages[0].senderName 
              ? messages[0].senderName.charAt(0).toUpperCase() 
              : "C"}
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {selectedClient && messages.length > 0
                ? messages[0].senderName || "Client"
                : "New Conversation"}
            </h3>
            <p className="text-xs text-blue-100 opacity-75">
              {messages.length} messages
            </p>
          </div>
        </div>
        <button 
          onClick={fetchMessages}
          className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-gray-50 to-blue-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-sm text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-gray-500 p-6">
            <div className="bg-blue-100 rounded-full p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="font-medium mb-1">No messages yet</p>
            <p className="text-sm text-center">Send a message to start the conversation</p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date} className="mb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-white/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
                  {formatDate(msgs[0].timestamp)}
                </div>
              </div>
              
              {msgs.map((message) => (
                <div
                  key={message._id}
                  className={`flex mb-3 ${
                    message.isAdmin ? "justify-end" : "justify-start"
                  }`}
                >
                  {!message.isAdmin && (
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-2 mt-1">
                      {message.senderName ? message.senderName.charAt(0).toUpperCase() : "C"}
                    </div>
                  )}
                  
                  <div
                    className={`max-w-xs md:max-w-sm lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                      message.isAdmin
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-none"
                        : "bg-white rounded-tl-none"
                    }`}
                  >
                    <p className={`text-sm ${message.isAdmin ? 'text-white' : 'text-gray-800'}`}>
                      {message.content}
                    </p>
                    <p className={`text-right text-xs mt-1 ${message.isAdmin ? 'text-blue-100' : 'text-gray-500'}`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  
                  {message.isAdmin && (
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium ml-2 mt-1">
                      A
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 p-3 flex items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Type a message"
            className="w-full bg-gray-100 rounded-full py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-colors"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={typing}
          />
          {typing && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-pulse flex space-x-1">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div className="h-2 w-2 bg-blue-500 rounded-full animation-delay-150"></div>
                <div className="h-2 w-2 bg-blue-500 rounded-full animation-delay-300"></div>
              </div>
            </div>
          )}
        </div>
        <button
          type="submit"
          className={`ml-2 ${
            newMessage.trim() && !typing
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              : "bg-gray-300 cursor-not-allowed"
          } text-white rounded-full p-3 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          disabled={!newMessage.trim() || typing}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}

export default ChatBox;