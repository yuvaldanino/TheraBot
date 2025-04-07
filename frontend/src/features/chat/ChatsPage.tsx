import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sessions } from '@/lib/api';
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortOrder = 'newest' | 'oldest';

const ChatsPage: React.FC = () => {
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessions.list(),
  });

  // Sort sessions based on the selected sort order
  const sortedSessions = sessionsData?.data
    ? [...sessionsData.data].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      })
    : [];

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">All Chats</h1>
        <button
          onClick={toggleSortOrder}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
        >
          <span>Sort by: {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
          {sortOrder === 'newest' ? (
            <ArrowDown className="h-4 w-4" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </button>
      </div>

      {sortedSessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">You don't have any chats yet.</p>
          <Link
            to="/chat/new"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start a New Chat
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSessions.map((session: any) => (
            <Link
              key={session.id}
              to={`/chat/${session.id}`}
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900 truncate">
                  {session.title || 'Untitled Chat'}
                </h2>
                <span className="text-sm text-gray-500">
                  {new Date(session.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="text-gray-600 mb-4">
                {session.summary || 'No summary available'}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {session.message_count || 0} messages
                </span>
                <span className="text-sm text-blue-600">View Chat →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatsPage; 