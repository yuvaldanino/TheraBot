import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { auth } from '../../lib/api';
import { Loader2 } from 'lucide-react';

const DashboardPage: React.FC = () => {
  // Fetch user profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await auth.getProfile();
      return response.data;
    },
  });

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome back, {profileData?.user?.username}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Emotional Profile Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Emotional Profile</h2>
          <div className="space-y-2">
            <p className="text-gray-600">
              Last Updated: {new Date(profileData?.emotional_profile?.last_updated).toLocaleDateString()}
            </p>
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Key Emotions</h3>
              {profileData?.emotional_profile?.long_term_analysis?.emotional_trends?.key_emotions?.map((emotion: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <span className="text-gray-600">{emotion.emotion}</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    emotion.trend === 'Stable' ? 'bg-green-100 text-green-800' :
                    emotion.trend === 'Improving' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {emotion.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Recent Activity Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {profileData?.emotional_profile?.pattern_history?.slice(0, 3).map((pattern: any, index: number) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm text-gray-500">
                  {new Date(pattern.timestamp).toLocaleDateString()}
                </p>
                <p className="text-gray-900">
                  {pattern.analysis?.therapeutic_insights?.breakthrough_moments?.[0] || 'Session completed'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Recommendations</h2>
          <div className="space-y-4">
            {profileData?.emotional_profile?.long_term_analysis?.recommendations?.map((rec: any, index: number) => (
              <div key={index} className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">{rec.focus_area}</h3>
                <p className="text-blue-800">{rec.reason}</p>
                <ul className="mt-2 list-disc list-inside text-blue-700">
                  {rec.suggested_approaches.map((approach: string, i: number) => (
                    <li key={i}>{approach}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 