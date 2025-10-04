import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HiOutlineFilter, HiOutlineDownload, HiOutlineRefresh } from 'react-icons/hi';
import { BsBarChartLine, BsPieChart } from 'react-icons/bs';

// Import analytics components
import FilterPanel from '../../../components/analytics/FilterPanel';
import UserReservationsChart from '../../../components/analytics/UserReservationsChart';
import CenterComparisonChart from '../../../components/analytics/CenterComparisonChart';
import { apiClient } from '../../../services/api';
import { reservationAnalyticsService } from '../../../services/analyticsService';
import { captureChartsWithMetadata } from '../../../utils/chartExportUtils';

const ReservationAnalytics = () => {
  const [filters, setFilters] = useState({
    centerId: '',
    userId: '',
    startDate: '',
    endDate: '',
    status: 'all',
    timeType: 'all'
  });

  const [showFilters, setShowFilters] = useState(false);
  // Remove viewMode state as we're removing table functionality
  const [isExporting, setIsExporting] = useState(false);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Use the new chart export service
      const success = await reservationAnalyticsService.exportToPDFWithCharts(filters);
      if (success) {
        console.log('PDF export completed successfully');
        // Optionally show a success message
        // alert('PDF export completed successfully! Check your downloads folder.');
      }
    } catch (error) {
      console.error('Error exporting PDF with charts:', error);
      let errorMessage = 'Failed to export PDF: ';
      
      // Check if the error message suggests the export might have worked
      if (error.message && error.message.includes('PDF export may have completed')) {
        console.warn('Export may have succeeded despite error');
        return; // Don't show error message
      }
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage += 'Backend server is not running or not accessible. Please check if the server is running on port 8080.';
      } else if (error.response?.status === 404) {
        errorMessage += 'Analytics endpoint not found. Please check if the backend analytics service is properly configured.';
      } else if (error.response?.status === 500) {
        errorMessage += 'Server error occurred while generating PDF. This might be due to missing dependencies (like PDF libraries) on the backend. Please check the server logs.';
      } else {
        errorMessage += `${error.message || 'Unknown error'}. Please try again.`;
      }
      
      alert(errorMessage);
    } finally {
      setIsExporting(false);
    }
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

  // Test functions removed

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BsBarChartLine className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              Reservation Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {filters.userId 
                ? 'Viewing analytics for selected student'
                : 'Analyze user reservations and compare center performance'
              }
            </p>
            {filters.userId && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  🎓 Student-Specific View
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle removed - only charts view now */}

            {/* Filter Toggle */}
            <button
              onClick={toggleFilters}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showFilters
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <HiOutlineFilter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              {getActiveFiltersCount() > 0 && (
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {getActiveFiltersCount()}
                </span>
              )}
            </button>

            {/* Test buttons removed */}
            
            {/* Export Button */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 
                         text-white rounded-lg font-medium transition-colors"
            >
              {isExporting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <HiOutlineDownload className="w-4 h-4" />
              )}
              {isExporting ? 'Exporting...' : 'Export PDF with Charts'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            isVisible={showFilters}
            onToggle={toggleFilters}
          />
        </motion.div>
      )}

      {/* Active Filters Summary */}
      {getActiveFiltersCount() > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiOutlineFilter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} applied
              </span>
            </div>
            <button
              onClick={() => handleFiltersChange({
                centerId: '',
                userId: '',
                startDate: '',
                endDate: '',
                status: 'all',
                timeType: 'all'
              })}
              className="text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-medium"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Charts View */}
      {(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        >
          {/* User Reservations Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <UserReservationsChart filters={filters} />
          </motion.div>

          {/* Center Comparison Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <CenterComparisonChart filters={filters} />
          </motion.div>
        </motion.div>
      )}

      {/* Table view removed */}

      {/* Quick Stats Footer */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 
                      border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Analytics Insights
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time data visualization with advanced filtering capabilities
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">📊</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Live Data</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">🎯</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Accurate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">⚡</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Fast</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationAnalytics; 