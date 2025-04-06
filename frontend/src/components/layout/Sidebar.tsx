import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auth, sessions } from '../../lib/api';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => auth.getProfile(),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessions.list(),
  });

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  return (
    <div className="w-64 h-screen bg-gray-800 text-white flex flex-col">
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            {profile?.user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="font-medium">{profile?.user?.username || 'User'}</div>
            <div className="text-sm text-gray-400">{profile?.user?.email || ''}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <Link
            to="/dashboard"
            className={`flex items-center space-x-2 p-2 rounded-lg ${
              isActive('/dashboard') ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Dashboard</span>
          </Link>

          <Link
            to="/chat"
            className={`flex items-center space-x-2 p-2 rounded-lg ${
              isActive('/chat') ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Chats</span>
          </Link>
        </div>

        {/* New Chat Button */}
        <div className="mt-4">
          <Link
            to="/chat/new"
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 p-2 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Chat</span>
          </Link>
        </div>

        {/* Recent Chats */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Recent Chats</h3>
          <div className="space-y-1">
            {sessionsData?.data?.map((session: any) => (
              <Link
                key={session.id}
                to={`/chat/${session.id}`}
                className={`block p-2 rounded-lg ${
                  isActive(`/chat/${session.id}`) ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{session.title || 'Untitled Chat'}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(session.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
            {sessionsData?.data?.length === 0 && (
              <p className="text-sm text-gray-500 italic">No recent chats</p>
            )}
          </div>
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 