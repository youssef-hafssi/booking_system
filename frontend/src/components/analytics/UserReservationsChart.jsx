import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import BarChart from './BarChart';
import { HiOutlineUsers, HiOutlineRefresh } from 'react-icons/hi';

const UserReservationsChart = ({ filters }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserReservations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        groupBy: 'user',
        timeType: filters?.timeType || 'all'
      };

      // Add optional filters
      if (filters?.centerId) params.centerId = filters.centerId;
      if (filters?.startDate) params.startDate = filters.startDate;
      if (filters?.endDate) params.endDate = filters.endDate;

      const response = await apiClient.get('/analytics/reservations/chart-data', { params });
      setChartData(response.data);
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      if (error.code === 'ERR_NETWORK') {
        setError('Backend server is not running or not accessible');
      } else if (error.response?.status === 404) {
        setError('Analytics endpoint not found - please check backend configuration');
      } else {
        setError('Failed to load user reservations data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserReservations();
  }, [filters]);

  const handleRefresh = () => {
    fetchUserReservations();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <HiOutlineUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top Users by Reservations</h3>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <HiOutlineUsers className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top Users by Reservations</h3>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <HiOutlineRefresh className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center justify-center h-64 text-red-600 dark:text-red-400">
          <div className="text-center">
            <p className="mb-2">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <HiOutlineUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {chartData?.title || 'Top Users by Reservations'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Most active users in the system
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Refresh data"
        >
          <HiOutlineRefresh className="w-5 h-5" />
        </button>
      </div>

      {chartData && chartData.data && chartData.data.length > 0 ? (
        <>
          <div className="mb-6">
            <BarChart data={chartData.data} height={320} />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {chartData.totalCount || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Reservations
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {chartData.data?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active Users
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {chartData.data?.length > 0 ? Math.round(chartData.totalCount / chartData.data.length) : 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Avg per User
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {chartData.data?.[0]?.value || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Top User
              </div>
            </div>
          </div>

          {/* Top Users List */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Performers
            </h4>
            <div className="space-y-3">
              {chartData.data.slice(0, 5).map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user.label}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {user.value} reservations
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${chartData.data.length > 0 ? (user.value / chartData.data[0].value) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {chartData.totalCount > 0 ? Math.round((user.value / chartData.totalCount) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <HiOutlineUsers className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No reservation data available</p>
            <p className="text-sm">Try adjusting your filters or check back later</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReservationsChart; 