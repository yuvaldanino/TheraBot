import React, { useState } from 'react';
import { sessions, auth } from '../../lib/api';

const SessionTest: React.FC = () => {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);

  const createTestSession = async () => {
    setLoading(true);
    setError(null);
    setResponseData(null);
    try {
      // First get the current user's profile
      console.log('Getting user profile...');
      const profileResponse = await auth.getProfile();
      console.log('User profile:', profileResponse);
      
      if (!profileResponse.data || !profileResponse.data.id) {
        throw new Error('No user profile found');
      }

      const userId = profileResponse.data.id;
      console.log('Creating test session for user:', userId);
      
      // Create session with user ID
      const response = await sessions.create('Test Session', userId);
      console.log('Full response:', response);
      setResponseData(response);
      
      if (response.data && response.data.id) {
        setSessionId(response.data.id);
      } else {
        setError('Session created but no ID returned');
      }
    } catch (err: any) {
      console.error('Error creating session:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to create session');
      setResponseData(err.response || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Session Creation Test</h1>
      
      <div className="mb-4">
        <button
          onClick={createTestSession}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Test Session'}
        </button>
      </div>

      {error && (
        <div className="text-red-500 mb-4">
          <h3 className="font-semibold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {sessionId && (
        <div className="bg-green-100 p-4 rounded-lg mb-4">
          <h2 className="font-semibold mb-2">Session Created Successfully!</h2>
          <p>Session ID: {sessionId}</p>
        </div>
      )}

      {responseData && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Response Data:</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
            {JSON.stringify(responseData, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Console Logs:</h2>
        <p className="text-sm text-gray-600">
          Check the browser console for detailed logs of the session creation process.
        </p>
      </div>
    </div>
  );
};

export default SessionTest; 