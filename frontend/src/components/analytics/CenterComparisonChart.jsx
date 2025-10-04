import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import PieChart from './PieChart';
import { HiOutlineOfficeBuilding, HiOutlineRefresh, HiOutlineTrendingUp } from 'react-icons/hi';

const CenterComparisonChart = ({ filters }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCenterComparison = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        groupBy: 'center',
        timeType: filters?.timeType || 'all'
      };

      // Add optional filters (but not centerId since we want to compare centers)
      if (filters?.userId) params.userId = filters.userId;
      if (filters?.startDate) params.startDate = filters.startDate;
      if (filters?.endDate) params.endDate = filters.endDate;
      if (filters?.status && filters.status !== 'all') params.status = filters.status;

      console.log('CenterComparisonChart: Sending params to backend:', params);
      const response = await apiClient.get('/analytics/reservations/chart-data', { params });
      setChartData(response.data);
    } catch (error) {
      console.error('Error fetching center comparison:', error);
      if (error.code === 'ERR_NETWORK') {
        setError('Backend server is not running or not accessible');
      } else if (error.response?.status === 404) {
        setError('Analytics endpoint not found - please check backend configuration');
      } else {
        setError('Failed to load center comparison data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenterComparison();
  }, [filters]);

  const handleRefresh = () => {
    fetchCenterComparison();
  };

  const getTopPerformer = () => {
    if (!chartData?.data || chartData.data.length === 0) return null;
    return chartData.data.reduce((max, center) => 
      center.value > max.value ? center : max
    );
  };

  const getTotalCenters = () => {
    return chartData?.data?.length || 0;
  };

  const getAverageReservations = () => {
    if (!chartData?.data || chartData.data.length === 0) return 0;
    return Math.round(chartData.totalCount / chartData.data.length);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <HiOutlineOfficeBuilding className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Center Comparison</h3>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <HiOutlineOfficeBuilding className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Center Comparison</h3>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
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

  const topPerformer = getTopPerformer();

  return (
    <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <HiOutlineOfficeBuilding className="w-6 h-6 text-green-600 dark:text-green-400" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {chartData?.title || (filters?.userId ? 'Student Activity by Center' : 'Reservations by Center')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filters?.userId 
                ? 'Student\'s reservation activity across centers'
                : 'Distribution across coding centers'
              }
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          title="Refresh data"
        >
          <HiOutlineRefresh className="w-5 h-5" />
        </button>
      </div>

      {chartData && chartData.data && chartData.data.length > 0 ? (
        <>
          <div className="mb-6">
            <PieChart data={chartData.data} height={350} />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {chartData.totalCount || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Reservations
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {getTotalCenters()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active Centers
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {getAverageReservations()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Avg per Center
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {topPerformer?.value || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Top Center
              </div>
            </div>
          </div>

          {/* Top Performer Highlight */}
          {topPerformer && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 mb-2">
                  <HiOutlineTrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Top Performing Center
                  </h4>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-green-700 dark:text-green-300">
                      {topPerformer.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {topPerformer.value} reservations ({Math.round((topPerformer.value / chartData.totalCount) * 100)}% of total)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      #{1}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Rank
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Center Performance Rankings */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance Rankings
            </h4>
            <div className="space-y-3">
              {chartData.data.map((center, index) => {
                const percentage = Math.round((center.value / chartData.totalCount) * 100);
                const isTopPerformer = index === 0;
                
                return (
                  <div key={index} className={`flex items-center justify-between p-4 rounded-lg border ${
                    isTopPerformer 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        isTopPerformer ? 'bg-green-500' : 
                        index === 1 ? 'bg-blue-500' : 
                        index === 2 ? 'bg-purple-500' : 'bg-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {center.label}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {center.value} reservations • {percentage}% of total
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            isTopPerformer ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ 
                            width: `${chartData.data.length > 0 ? (center.value / chartData.data[0].value) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      {isTopPerformer && (
                        <HiOutlineTrendingUp className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <HiOutlineOfficeBuilding className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No center data available</p>
            <p className="text-sm">Try adjusting your filters or check back later</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CenterComparisonChart; 