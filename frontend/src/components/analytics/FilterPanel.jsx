import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { HiOutlineFilter, HiOutlineX, HiOutlineCalendar } from 'react-icons/hi';
import { motion, AnimatePresence } from 'motion/react';

const FilterPanel = ({ filters, onFiltersChange, isVisible, onToggle }) => {
  const [centers, setCenters] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Quick date range presets
  const datePresets = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Quarter', value: 'quarter' },
    { label: 'This Year', value: 'year' },
    { label: 'All Time', value: 'all' }
  ];

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  const timeTypeOptions = [
    { label: 'All Reservations', value: 'all' },
    { label: 'Past Reservations', value: 'past' },
    { label: 'Upcoming Reservations', value: 'upcoming' }
  ];

  useEffect(() => {
    const fetchFilterData = async () => {
      setLoading(true);
      try {
        const centersResponse = await apiClient.get('/centers');
        setCenters(Array.isArray(centersResponse.data) ? centersResponse.data : []);
      } catch (error) {
        console.error('Error fetching centers:', error);
        setCenters([]);
      } finally {
        setLoading(false);
      }
    };

    if (isVisible) {
      fetchFilterData();
    }
  }, [isVisible]);

  // Fetch users when center changes
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        let usersResponse;
        if (filters.centerId) {
          // Fetch users for specific center (paginated response)
          usersResponse = await apiClient.get(`/users/center/${filters.centerId}`, {
            params: { size: 1000 } // Get a large number to include all users
          });
          // Handle paginated response
          const userData = usersResponse.data.content || usersResponse.data;
          setUsers(Array.isArray(userData) ? userData : []);
        } else {
          // Fetch all users (paginated response)
          usersResponse = await apiClient.get('/users', {
            params: { size: 1000 } // Get a large number to include all users
          });
          // Handle paginated response
          const userData = usersResponse.data.content || usersResponse.data;
          setUsers(Array.isArray(userData) ? userData : []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (isVisible) {
      fetchUsers();
    }
  }, [filters.centerId, isVisible]);

  const handleFilterChange = (key, value) => {
    // If center is changing, clear the user selection since users will change
    if (key === 'centerId') {
      onFiltersChange({ ...filters, [key]: value, userId: '' });
    } else {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  const handleDatePreset = (preset) => {
    const today = new Date();
    let startDate = '';
    let endDate = today.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        startDate = endDate;
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = monthStart.toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
        startDate = quarterStart.toISOString().split('T')[0];
        break;
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        startDate = yearStart.toISOString().split('T')[0];
        break;
      case 'all':
        startDate = '';
        endDate = '';
        break;
      default:
        return;
    }

    onFiltersChange({
      ...filters,
      startDate,
      endDate
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      centerId: '',
      userId: '',
      startDate: '',
      endDate: '',
      status: 'all',
      timeType: 'all'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.centerId) count++;
    if (filters.userId) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.status && filters.status !== 'all') count++;
    if (filters.timeType && filters.timeType !== 'all') count++;
    return count;
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <HiOutlineFilter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
          {getActiveFiltersCount() > 0 && (
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded-full">
              {getActiveFiltersCount()} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6">
              {/* Quick Date Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Quick Date Ranges
                </label>
                <div className="flex flex-wrap gap-2">
                  {datePresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleDatePreset(preset.value)}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                                 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 
                                 rounded-full transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Center Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Center
                  </label>
                  <select
                    value={filters.centerId || ''}
                    onChange={(e) => handleFilterChange('centerId', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="">All Centers</option>
                    {centers.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.name} - {center.city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    User
                    {filters.centerId && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                        (filtered by center)
                      </span>
                    )}
                  </label>
                  <select
                    value={filters.userId || ''}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading || loadingUsers}
                  >
                    <option value="">
                      {loadingUsers ? 'Loading users...' : 
                       filters.centerId ? 'All Users in Center' : 'All Users'}
                    </option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status || 'all'}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={filters.startDate || ''}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <HiOutlineCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={filters.endDate || ''}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <HiOutlineCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Time Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Period
                  </label>
                  <select
                    value={filters.timeType || 'all'}
                    onChange={(e) => handleFilterChange('timeType', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {timeTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filters Display */}
              {getActiveFiltersCount() > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Active Filters:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {filters.centerId && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded-full">
                        Center: {centers.find(c => c.id.toString() === filters.centerId)?.name || 'Unknown'}
                        <button
                          onClick={() => handleFilterChange('centerId', '')}
                          className="ml-1 hover:text-blue-600"
                        >
                          <HiOutlineX className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filters.userId && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm rounded-full">
                        User: {users.find(u => u.id.toString() === filters.userId)?.firstName || 'Unknown'}
                        <button
                          onClick={() => handleFilterChange('userId', '')}
                          className="ml-1 hover:text-green-600"
                        >
                          <HiOutlineX className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {(filters.startDate || filters.endDate) && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-sm rounded-full">
                        Date: {filters.startDate || 'Start'} - {filters.endDate || 'End'}
                        <button
                          onClick={() => handleFilterChange('startDate', '') || handleFilterChange('endDate', '')}
                          className="ml-1 hover:text-purple-600"
                        >
                          <HiOutlineX className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filters.status && filters.status !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-sm rounded-full">
                        Status: {filters.status}
                        <button
                          onClick={() => handleFilterChange('status', 'all')}
                          className="ml-1 hover:text-yellow-600"
                        >
                          <HiOutlineX className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterPanel; 