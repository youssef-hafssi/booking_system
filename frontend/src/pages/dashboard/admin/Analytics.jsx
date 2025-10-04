import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import InteractiveHoverButton from '../../../components/ui/InteractiveHoverButton';

const API_URL = 'http://localhost:8080/api';

const Analytics = () => {
  const { token } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('week'); // 'day', 'week', 'month', 'year'
  
  // Mock data for analytics
  const [analyticsData, setAnalyticsData] = useState({
    reservationsByDay: [
      { day: 'Monday', count: 12 },
      { day: 'Tuesday', count: 19 },
      { day: 'Wednesday', count: 15 },
      { day: 'Thursday', count: 22 },
      { day: 'Friday', count: 30 },
      { day: 'Saturday', count: 8 },
      { day: 'Sunday', count: 5 },
    ],
    workstationUsage: [
      { name: 'Desktop PCs', usage: 68 },
      { name: 'Laptops', usage: 45 },
      { name: 'Specialized', usage: 25 },
    ],
    centerComparison: [
      { name: 'Paris Center', reservations: 120, workstations: 35 },
      { name: 'Lyon Center', reservations: 85, workstations: 25 },
      { name: 'Marseille Center', reservations: 65, workstations: 20 },
    ],
    topUsers: [
      { name: 'Jean Dupont', reservations: 15 },
      { name: 'Marie Curie', reservations: 12 },
      { name: 'Pierre Martin', reservations: 10 },
      { name: 'Sophie Laurent', reservations: 8 },
      { name: 'Lucas Bernard', reservations: 7 },
    ]
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics data from the backend
      const response = await axios.get(`${API_URL}/statistics`, {
        params: { timeframe },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // If we have data from the backend, use it
      if (response.data) {
        setAnalyticsData(response.data);
      } else {
        setError('No data returned from the backend');
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch analytics data: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  // Helper function to get the maximum value for chart scaling
  const getMaxValue = (data, key) => {
    return Math.max(...data.map(item => item[key])) * 1.2; // Add 20% padding
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Reporting</h2>
        
        <div className="flex space-x-2">
          <InteractiveHoverButton
            onClick={() => handleTimeframeChange('day')}
            variant={timeframe === 'day' ? 'primary' : 'secondary'}
            size="sm"
          >
            Day
          </InteractiveHoverButton>
          <InteractiveHoverButton
            onClick={() => handleTimeframeChange('week')}
            variant={timeframe === 'week' ? 'primary' : 'secondary'}
            size="sm"
          >
            Week
          </InteractiveHoverButton>
          <InteractiveHoverButton
            onClick={() => handleTimeframeChange('month')}
            variant={timeframe === 'month' ? 'primary' : 'secondary'}
            size="sm"
          >
            Month
          </InteractiveHoverButton>
          <InteractiveHoverButton
            onClick={() => handleTimeframeChange('year')}
            variant={timeframe === 'year' ? 'primary' : 'secondary'}
            size="sm"
          >
            Year
          </InteractiveHoverButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Reservations by Day Chart */}
        <div className="bg-white dark:bg-dark-sidebar rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Reservations by {timeframe === 'day' ? 'Hour' : timeframe === 'week' ? 'Day' : timeframe === 'month' ? 'Week' : 'Month'}
          </h3>
          
          <div className="h-64 flex items-end space-x-2">
            {analyticsData.reservationsByDay.map((item, index) => {
              const maxValue = getMaxValue(analyticsData.reservationsByDay, 'count');
              const height = (item.count / maxValue) * 100;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-blue-500 dark:bg-blue-600 rounded-t hover:bg-blue-600 dark:hover:bg-blue-500 transition-all"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="text-xs mt-2 text-gray-600 dark:text-gray-400">{item.day}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{item.count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workstation Usage Chart */}
        <div className="bg-white dark:bg-dark-sidebar rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Workstation Usage by Type</h3>
          
          <div className="h-64 flex flex-col justify-center space-y-4">
            {analyticsData.workstationUsage.map((item, index) => {
              const maxValue = getMaxValue(analyticsData.workstationUsage, 'usage');
              const width = (item.usage / maxValue) * 100;
              
              return (
                <div key={index} className="flex items-center">
                  <div className="w-24 text-sm text-gray-600 dark:text-gray-400">{item.name}</div>
                  <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        index === 0 ? 'bg-green-500 dark:bg-green-600' : 
                        index === 1 ? 'bg-purple-500 dark:bg-purple-600' : 
                        'bg-amber-500 dark:bg-amber-600'
                      }`}
                      style={{ width: `${width}%` }}
                    ></div>
                  </div>
                  <div className="ml-3 text-sm font-medium text-gray-900 dark:text-white">{item.usage}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Center Comparison */}
        <div className="bg-white dark:bg-dark-sidebar rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Center Comparison</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Center
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Workstations
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reservations
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Utilization
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {analyticsData.centerComparison.map((center, index) => {
                  // Calculate utilization rate (reservations per workstation)
                  const utilization = (center.reservations / center.workstations).toFixed(1);
                  
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {center.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {center.workstations}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {center.reservations}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          utilization > 4 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          utilization > 3 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {utilization}x
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white dark:bg-dark-sidebar rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Users</h3>
          
          <div className="space-y-4">
            {analyticsData.topUsers.map((user, index) => {
              const maxValue = getMaxValue(analyticsData.topUsers, 'reservations');
              const width = (user.reservations / maxValue) * 100;
              
              return (
                <div key={index} className="flex items-center">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-800 dark:text-indigo-300 font-medium mr-3">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{user.reservations} reservations</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div 
                        className="h-full bg-indigo-500 dark:bg-indigo-600 rounded-full"
                        style={{ width: `${width}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 