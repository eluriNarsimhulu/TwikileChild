import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Send, ArrowDownCircle, ArrowLeft, RefreshCw } from "lucide-react";

function ClientChatBox() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [newMessageAlert, setNewMessageAlert] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (expanded) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 15000); // Poll for new messages every 15 seconds
      return () => clearInterval(interval);
    }
  }, [expanded]);

  useEffect(() => {
    if (expanded) {
      scrollToBottom();
    }
  }, [messages, expanded]);

  useEffect(() => {
    // Check for unread messages periodically
    const checkUnreadInterval = setInterval(checkUnreadMessages, 30000);
    checkUnreadMessages(); // Check immediately on component mount
    
    return () => clearInterval(checkUnreadInterval);
  }, []);

  const checkUnreadMessages = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/messages/unread/count",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUnreadCount(res.data.count);
      if (res.data.count > 0 && !expanded) {
        setNewMessageAlert(true);
      }
    } catch (error) {
      console.error("Error checking unread messages:", error);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:5000/messages/admin",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Mark messages as read
      if (res.data.length > 0) {
        try {
          await axios.put(
            "http://localhost:5000/messages/read/admin",
            {},
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
        } catch (readError) {
          console.warn("Failed to mark messages as read:", readError);
          // Don't block the UI for this error
        }
      }
      
      setMessages(res.data);
      setUnreadCount(0);
      setNewMessageAlert(false);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching messages:", error.response?.data || error.message);
      setLoading(false);
      // Show a user-friendly error
      if (messages.length === 0) {
        setMessages([{
          _id: "error-message",
          content: "Under Devlopment...Sorry for Inconvenience.",
          timestamp: new Date(),
          isAdmin: true,
          senderName: "System"
        }]);
      }
    }
  };

  
// 1. Enhanced error handling in ClientChatBox.jsx
const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
  
    try {
      setSending(true);
      const res = await axios.post(
        "http://localhost:5000/messages",
        {
          receiverId: "admin", // Special identifier for admin
          content: newMessage
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Add the new message to the messages array
      const newMessageObj = {
        ...res.data,
        isAdmin: false,
        senderName: "You" // Or use the actual user name if available
      };
      
      setMessages([...messages, newMessageObj]);
      setNewMessage("");
      setSending(false);
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error.message);
      // Show error to user
      alert("Failed to send message. Please try again.");
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleChat = () => {
    setExpanded(!expanded);
    if (!expanded) {
      setNewMessageAlert(false);
    }
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

  // If there's new content not in view, show a "new messages" button
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const atBottom = scrollHeight - scrollTop <= clientHeight + 100;
      
      if (!atBottom && messages.length > 0) {
        setNewMessageAlert(true);
      } else {
        setNewMessageAlert(false);
      }
    }
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col transition-all duration-300 shadow-xl rounded-2xl ${expanded ? 'h-[500px] w-[380px]' : 'h-14 w-14'}`}>
      {/* Chat Header */}
      <div 
        className={`${expanded ? 'rounded-t-2xl' : 'rounded-full'} bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between cursor-pointer`}
        onClick={toggleChat}
      >
        {expanded ? (
          <>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white font-medium mr-3">
                A
              </div>
              <div>
                <h3 className="font-semibold text-lg">Admin Support</h3>
                <p className="text-xs text-indigo-200 opacity-75">
                  {messages.length} messages
                </p>
              </div>
            </div>
            <button className="text-white/80 hover:text-white p-1">
              <ArrowLeft size={20} />
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 rounded-full h-5 w-5 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{unreadCount}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages Area */}
      {expanded && (
        <div 
          className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-gray-50 to-indigo-50"
          ref={chatContainerRef}
          onScroll={handleScroll}
        >
          {loading && messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-2"></div>
                <p className="text-sm text-gray-500">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-gray-500 p-6">
              <div className="bg-indigo-100 rounded-full p-4 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="font-medium mb-1">No messages yet</p>
              <p className="text-sm text-center">Send a message to start the conversation with admin</p>
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
                      !message.isAdmin ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.isAdmin && (
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium mr-2 mt-1">
                        A
                      </div>
                    )}
                    
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg shadow-sm ${
                        !message.isAdmin
                          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-tr-none"
                          : "bg-white rounded-tl-none"
                      }`}
                    >
                      <p className={`text-sm ${!message.isAdmin ? 'text-white' : 'text-gray-800'}`}>
                        {message.content}
                      </p>
                      <p className={`text-right text-xs mt-1 ${!message.isAdmin ? 'text-indigo-100' : 'text-gray-500'}`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                    
                    {!message.isAdmin && (
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium ml-2 mt-1">
                        {message.senderName ? message.senderName.charAt(0).toUpperCase() : "You"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
          
          {/* New messages alert */}
          {newMessageAlert && messages.length > 0 && (
            <button
              className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center animate-bounce"
              onClick={scrollToBottom}
            >
              <ArrowDownCircle size={16} className="mr-2" />
              New messages
            </button>
          )}
          
          {/* Loading indicator for new messages */}
          {loading && messages.length > 0 && (
            <div className="flex justify-center my-4">
              <RefreshCw size={20} className="text-indigo-500 animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Message Input */}
      {expanded && (
        <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 p-3 flex items-center rounded-b-2xl">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full bg-gray-100 rounded-full py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
            />
            {sending && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-pulse flex space-x-1">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
                  <div className="h-2 w-2 bg-indigo-500 rounded-full animation-delay-150"></div>
                  <div className="h-2 w-2 bg-indigo-500 rounded-full animation-delay-300"></div>
                </div>
              </div>
            )}
          </div>
          <button
            type="submit"
            className={`ml-2 ${
              newMessage.trim() && !sending
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                : "bg-gray-300 cursor-not-allowed"
            } text-white rounded-full p-3 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            disabled={!newMessage.trim() || sending}
          >
            <Send size={18} />
          </button>
        </form>
      )}
      
      {/* Notification dot for collapsed state */}
      {!expanded && newMessageAlert && (
        <div className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
}

export default ClientChatBox;