import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessions, auth } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

const ChatPage: React.FC = () => {
  const { sessionId: urlSessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await auth.getProfile();
      return response.data;
    },
  });

  // Fetch current session if sessionId is provided
  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', urlSessionId],
    queryFn: async () => {
      if (!urlSessionId) return null;
      const response = await sessions.get(parseInt(urlSessionId));
      return response.data;
    },
    enabled: !!urlSessionId,
  });

  // Update current session ID when URL changes
  useEffect(() => {
    if (urlSessionId) {
      setCurrentSessionId(parseInt(urlSessionId));
      // Load messages from session
      if (sessionData?.messages) {
        setMessages(sessionData.messages.map((msg: any) => ({
          content: msg.content,
          is_from_user: msg.is_from_user === true,
          timestamp: msg.timestamp
        })));
      }
    } else {
      setCurrentSessionId(null);
      setMessages([]);
    }
  }, [urlSessionId, sessionData]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ sessionId, content }: { sessionId: number; content: string }) => {
      const response = await sessions.sendMessage(sessionId, content);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Add user message to list immediately
      const userMessage = {
        content: variables.content,
        is_from_user: true,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      
      // Poll for the response
      let attempts = 0;
      const maxAttempts = 10;
      const pollInterval = 1000; // 1 second
      
      const pollForResponse = async () => {
        const sessionResponse = await sessions.get(variables.sessionId);
        
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
          toast.error('Response timeout - please try again');
        }
      };
      
      // Start polling
      setTimeout(pollForResponse, pollInterval);
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setLoading(false);
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim() || !currentSessionId) return;
    
    setLoading(true);
    
    try {
      await sendMessage.mutateAsync({
        sessionId: currentSessionId,
        content: message
      });
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (profileLoading || sessionLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSessionId ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
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
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <div className="border-t p-4 bg-white">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!message.trim() || loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Select a chat or start a new one</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage; 