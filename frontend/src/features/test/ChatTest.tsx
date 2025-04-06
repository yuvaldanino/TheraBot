import React, { useState } from 'react';
import { sessions, auth } from '../../lib/api';

const ChatTest: React.FC = () => {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user profile
      const profileResponse = await auth.getProfile();
      if (!profileResponse.data || !profileResponse.data.id) {
        throw new Error('No user profile found');
      }
      const userId = profileResponse.data.id;
      
      // Create session
      const sessionResponse = await sessions.create('Test Chat Session', userId);
      console.log('Session created:', sessionResponse);
      
      setSessionId(sessionResponse.data.id);
      setMessages([]);
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!sessionId || !message.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Send message
      const messageResponse = await sessions.sendMessage(sessionId, message);
      console.log('Message sent:', messageResponse);
      
      // Add user message to list immediately
      const userMessage = {
        content: message,
        is_from_user: true,
        timestamp: new Date().toISOString()
      };
      
      // Add the message to our list
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      
      // Poll for the response
      let attempts = 0;
      const maxAttempts = 10;
      const pollInterval = 1000; // 1 second
      
      const pollForResponse = async () => {
        const sessionResponse = await sessions.get(sessionId);
        console.log('Polling session:', sessionResponse);
        
        if (sessionResponse.data.messages && sessionResponse.data.messages.length > messages.length + 1) {
          // We have a new message
          // Get the latest message (the bot's response)
          const latestMessage = sessionResponse.data.messages[sessionResponse.data.messages.length - 1];
          
          // Add the bot's response to our list
          setMessages(prev => [...prev, {
            content: latestMessage.content,
            is_from_user: false,
            timestamp: latestMessage.timestamp
          }]);
          
          setLoading(false);
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollForResponse, pollInterval);
        } else {
          setLoading(false);
          setError('Response timeout - please try again');
        }
      };
      
      // Start polling
      setTimeout(pollForResponse, pollInterval);
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to send message';
      setError(`Failed to send message: ${errorMessage}`);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Chat Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <button
          onClick={createNewSession}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create New Session'}
        </button>
        {sessionId && (
          <span className="ml-4 text-gray-600">
            Session ID: {sessionId}
          </span>
        )}
      </div>
      
      <div className="border rounded-lg p-4 mb-4 h-96 overflow-y-auto bg-gray-50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded ${
              msg.is_from_user
                ? 'bg-blue-100 ml-auto'
                : 'bg-white'
            } max-w-[80%] ${msg.is_from_user ? 'ml-auto' : 'mr-auto'}`}
          >
            <p className="text-sm text-gray-800">{msg.content}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ))}
        {loading && (
          <div className="bg-white p-2 rounded max-w-[80%] mr-auto">
            <p className="text-sm text-gray-500">Therabot is typing...</p>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
          disabled={!sessionId || loading}
        />
        <button
          onClick={sendMessage}
          disabled={!sessionId || !message.trim() || loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatTest; 