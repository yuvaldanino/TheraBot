import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './features/auth/LoginPage';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './features/dashboard/DashboardPage';
import ChatPage from './features/chat/ChatPage';
import ChatsPage from './features/chat/ChatsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SessionTest from './features/test/SessionTest';
import ChatTest from './features/test/ChatTest';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/test" element={<SessionTest />} />
          <Route path="/chat-test" element={<ChatTest />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="chats" element={<ChatsPage />} />
              <Route path="chat">
                <Route index element={<Navigate to="/chats" replace />} />
                <Route path="new" element={<ChatPage />} />
                <Route path=":sessionId" element={<ChatPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
