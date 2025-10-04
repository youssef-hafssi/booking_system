import React from 'react';
import InteractiveHoverButton from './ui/InteractiveHoverButton';

const FilterPanel = ({ filters, onFilterChange, users = [], centers = [], isDark }) => {
  const handleFilterUpdate = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      centerId: '',
      userId: '',
      startDate: '',
      endDate: '',
      status: 'all',
      timeType: 'all'
    };
    onFilterChange(clearedFilters);
  };

  const setQuickDateRange = (range) => {
    const today = new Date();
    let startDate, endDate;

    switch (range) {
      case 'today':
        startDate = endDate = today.toISOString().split('T')[0];
        break;
      case 'week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        startDate = quarterStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      default:
        return;
    }

    handleFilterUpdate('startDate', startDate);
    handleFilterUpdate('endDate', endDate);
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filters
        </h3>
        <InteractiveHoverButton
          onClick={clearFilters}
          variant="secondary"
          size="sm"
        >
          Clear All
        </InteractiveHoverButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Center Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Center
          </label>
          <select
            value={filters.centerId}
            onChange={(e) => handleFilterUpdate('centerId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          >
            <option value="">All Centers</option>
            {centers && centers.length > 0 && centers.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name} ({center.city})
              </option>
            ))}
          </select>
        </div>

        {/* User Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            User
          </label>
          <select
            value={filters.userId}
            onChange={(e) => handleFilterUpdate('userId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          >
            <option value="">All Users</option>
            {users && users.length > 0 && users.map((user) => (
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
            value={filters.status}
            onChange={(e) => handleFilterUpdate('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </select>
        </div>

        {/* Time Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Period
          </label>
          <select
            value={filters.timeType}
            onChange={(e) => handleFilterUpdate('timeType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          >
            <option value="all">All Time</option>
            <option value="past">Past Reservations</option>
            <option value="upcoming">Upcoming Reservations</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterUpdate('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterUpdate('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          />
        </div>
      </div>

      {/* Quick Date Range Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quick Date Ranges
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Today', value: 'today' },
            { label: 'Last 7 Days', value: 'week' },
            { label: 'This Month', value: 'month' },
            { label: 'This Quarter', value: 'quarter' }
          ].map((range) => (
            <InteractiveHoverButton
              key={range.value}
              onClick={() => setQuickDateRange(range.value)}
              variant="secondary"
              size="sm"
            >
              {range.label}
            </InteractiveHoverButton>
          ))}
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.centerId || filters.userId || filters.startDate || filters.endDate || 
        filters.status !== 'all' || filters.timeType !== 'all') && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Active Filters
          </label>
          <div className="flex flex-wrap gap-2">
            {filters.centerId && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-light">
                Center: {centers && centers.find(c => c.id.toString() === filters.centerId)?.name || filters.centerId}
                <button
                  onClick={() => handleFilterUpdate('centerId', '')}
                  className="ml-1 text-brand-primary hover:text-brand-hover dark:text-brand-light dark:hover:text-brand-lighter"
                >
                  ×
                </button>
              </span>
            )}
            {filters.userId && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                User: {users && users.find(u => u.id.toString() === filters.userId)?.firstName || filters.userId}
                <button
                  onClick={() => handleFilterUpdate('userId', '')}
                  className="ml-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                >
                  ×
                </button>
              </span>
            )}
            {filters.status !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                Status: {filters.status}
                <button
                  onClick={() => handleFilterUpdate('status', 'all')}
                  className="ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                >
                  ×
                </button>
              </span>
            )}
            {filters.timeType !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                Time: {filters.timeType}
                <button
                  onClick={() => handleFilterUpdate('timeType', 'all')}
                  className="ml-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                >
                  ×
                </button>
              </span>
            )}
            {filters.startDate && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                From: {filters.startDate}
                <button
                  onClick={() => handleFilterUpdate('startDate', '')}
                  className="ml-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ×
                </button>
              </span>
            )}
            {filters.endDate && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                To: {filters.endDate}
                <button
                  onClick={() => handleFilterUpdate('endDate', '')}
                  className="ml-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel; 