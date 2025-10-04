import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { userService, centerService } from '../../../services/api';
import api from '../../../services/api';

// UI Components
import InteractiveHoverButton from '../../../components/ui/InteractiveHoverButton';
import ChartComponent from '../../../components/ChartComponent';
import FilterPanel from '../../../components/FilterPanel';

// Icons
import { HiDownload, HiFilter, HiRefresh } from 'react-icons/hi';
import { BsBarChartLine, BsTable } from 'react-icons/bs';

const EnhancedAnalytics = () => {
  const { user, token } = useAuth();
  const { isDark } = useTheme();

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Data state
  const [reservations, setReservations] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [users, setUsers] = useState([]);
  const [centers, setCenters] = useState([]);

  // Filter state
  const [filters, setFilters] = useState({
    centerId: '',
    userId: '',
    startDate: '',
    endDate: '',
    status: 'all',
    timeType: 'all'
  });

  // View state
  const [viewType, setViewType] = useState('chart'); // 'chart', 'table'
  const [chartType, setChartType] = useState('bar'); // 'bar', 'pie', 'line'
  const [groupBy, setGroupBy] = useState('day'); // 'day', 'week', 'month', 'user', 'center', 'status'
  const [showFilters, setShowFilters] = useState(true);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        // Load users and centers for filter dropdowns
        const [usersResponse, centersResponse] = await Promise.all([
          userService.getAllUsers(),
          centerService.getAllCenters()
        ]);

        setUsers(usersResponse.data || []);
        setCenters(centersResponse.data || []);

        // Load initial data
        await fetchData();
      } catch (err) {
        console.error('Error initializing analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Fetch data based on current filters
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [reservationsResponse, chartDataResponse] = await Promise.all([
        api.analytics.getFilteredReservations(filters),
        api.analytics.getReservationChartData(filters, groupBy)
      ]);

      setReservations(reservationsResponse.data || []);
      setChartData(chartDataResponse.data || null);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Handle view changes
  const handleViewChange = (newViewType) => {
    setViewType(newViewType);
  };

  const handleChartTypeChange = (newChartType) => {
    setChartType(newChartType);
  };

  const handleGroupByChange = (newGroupBy) => {
    setGroupBy(newGroupBy);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchData();
  };

  // Export to PDF with charts
  const handleExportPDF = async () => {
    try {
      setExporting(true);

      // Import the service here to avoid circular dependencies
      const { reservationAnalyticsService } = await import('../../../services/analyticsService');
      await reservationAnalyticsService.exportToPDFWithCharts(filters);
    } catch (err) {
      console.error('Error exporting PDF with charts:', err);
      setError('Failed to export PDF with charts');
    } finally {
      setExporting(false);
    }
  };

  // Re-fetch data when filters or groupBy change
  useEffect(() => {
    if (users.length > 0 && centers.length > 0) {
      fetchData();
    }
  }, [filters, groupBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Enhanced Analytics & Reporting
        </h2>

        <div className="flex space-x-2">
          <InteractiveHoverButton
            onClick={() => setShowFilters(!showFilters)}
            variant="secondary"
            size="sm"
          >
            <HiFilter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </InteractiveHoverButton>

          <InteractiveHoverButton
            onClick={handleRefresh}
            variant="secondary"
            size="sm"
            disabled={loading}
          >
            <HiRefresh className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </InteractiveHoverButton>

          <InteractiveHoverButton
            onClick={handleExportPDF}
            variant="primary"
            size="sm"
            disabled={exporting || reservations.length === 0}
          >
            <HiDownload className="w-4 h-4 mr-2" />
                          {exporting ? 'Exporting...' : 'Export PDF with Charts'}
          </InteractiveHoverButton>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          users={users}
          centers={centers}
          isDark={isDark}
        />
      )}

      {/* View Controls */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-center">
          {/* View Type */}
          <div className="flex space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
            <InteractiveHoverButton
              onClick={() => handleViewChange('chart')}
              variant={viewType === 'chart' ? 'primary' : 'secondary'}
              size="sm"
            >
              <BsBarChartLine className="w-4 h-4 mr-1" />
              Chart
            </InteractiveHoverButton>
            <InteractiveHoverButton
              onClick={() => handleViewChange('table')}
              variant={viewType === 'table' ? 'primary' : 'secondary'}
              size="sm"
            >
              <BsTable className="w-4 h-4 mr-1" />
              Table
            </InteractiveHoverButton>
          </div>

          {/* Chart Type (only show when chart view is selected) */}
          {viewType === 'chart' && (
            <div className="flex space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chart:</span>
              <InteractiveHoverButton
                onClick={() => handleChartTypeChange('bar')}
                variant={chartType === 'bar' ? 'primary' : 'secondary'}
                size="sm"
              >
                Bar
              </InteractiveHoverButton>
              <InteractiveHoverButton
                onClick={() => handleChartTypeChange('pie')}
                variant={chartType === 'pie' ? 'primary' : 'secondary'}
                size="sm"
              >
                Pie
              </InteractiveHoverButton>
            </div>
          )}

          {/* Group By */}
          <div className="flex space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Group By:</span>
            {['day', 'week', 'month', 'user', 'center', 'status'].map((option) => (
              <InteractiveHoverButton
                key={option}
                onClick={() => handleGroupByChange(option)}
                variant={groupBy === option ? 'primary' : 'secondary'}
                size="sm"
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </InteractiveHoverButton>
            ))}
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Showing {reservations.length} reservation{reservations.length !== 1 ? 's' : ''}
            </span>
            {filters.startDate && filters.endDate && (
              <span>
                From {filters.startDate} to {filters.endDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-accent-yellow"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-card rounded-lg shadow border border-gray-200 dark:border-gray-700">
          {viewType === 'chart' ? (
            <ChartComponent
              data={chartData}
              type={chartType}
              title={chartData?.title || 'Reservations Analysis'}
              isDark={isDark}
            />
          ) : (
            <ReservationsTable
              reservations={reservations}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Reservations Table Component
const ReservationsTable = ({ reservations }) => {
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Sort reservations
  const sortedReservations = [...reservations].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Paginate reservations
  const paginatedReservations = sortedReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(reservations.length / itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {[
                { key: 'id', label: 'ID' },
                { key: 'user', label: 'User' },
                { key: 'workStation', label: 'Workstation' },
                { key: 'startTime', label: 'Start Time' },
                { key: 'endTime', label: 'End Time' },
                { key: 'status', label: 'Status' },
                { key: 'createdAt', label: 'Created' }
              ].map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {sortField === column.key && (
                      <span className="text-blue-500">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {paginatedReservations.map((reservation) => (
              <tr key={reservation.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {reservation.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {reservation.user?.firstName} {reservation.user?.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {reservation.workStation?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(reservation.startTime).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(reservation.endTime).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    reservation.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    reservation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    reservation.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                  }`}>
                    {reservation.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(reservation.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, reservations.length)} of {reservations.length} results
          </div>
          <div className="flex space-x-2">
            <InteractiveHoverButton
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
            >
              Previous
            </InteractiveHoverButton>
            <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <InteractiveHoverButton
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
            >
              Next
            </InteractiveHoverButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAnalytics;