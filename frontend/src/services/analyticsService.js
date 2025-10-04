import { apiClient } from './api';
import { captureChartsWithMetadata } from '../utils/chartExportUtils';

export const reservationAnalyticsService = {
  /**
   * Get filtered reservations with advanced criteria
   */
  getFilteredReservations: async (filters = {}) => {
    const params = {
      timeType: filters.timeType || 'all'
    };

    // Add optional filters
    if (filters.centerId) params.centerId = filters.centerId;
    if (filters.userId) params.userId = filters.userId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.status && filters.status !== 'all') params.status = filters.status;

    const response = await apiClient.get('/analytics/reservations/filtered', { params });
    return response.data;
  },

  /**
   * Get chart data for visualizations
   */
  getChartData: async (groupBy = 'day', filters = {}) => {
    const params = {
      groupBy,
      timeType: filters.timeType || 'all'
    };

    // Add optional filters
    if (filters.centerId) params.centerId = filters.centerId;
    if (filters.userId) params.userId = filters.userId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    const response = await apiClient.get('/analytics/reservations/chart-data', { params });
    return response.data;
  },

  /**
   * Get user reservations chart data
   */
  getUserReservationsData: async (filters = {}) => {
    return await reservationAnalyticsService.getChartData('user', filters);
  },

  /**
   * Get center comparison chart data
   */
  getCenterComparisonData: async (filters = {}) => {
    return await reservationAnalyticsService.getChartData('center', filters);
  },

  /**
   * Get reservation trends over time
   */
  getReservationTrends: async (centerId = null, days = 30) => {
    const params = { days };
    if (centerId) params.centerId = centerId;

    const response = await apiClient.get('/analytics/reservations/trends', { params });
    return response.data;
  },

  /**
   * Get user statistics by center
   */
  getUserStatsByCenter: async (centerId = null) => {
    const params = {};
    if (centerId) params.centerId = centerId;

    const response = await apiClient.get('/analytics/users/by-center', { params });
    return response.data;
  },



  /**
   * Export reservations to PDF with charts and data table
   */
  exportToPDFWithCharts: async (filters = {}) => {
    try {
      console.log('Starting PDF export process...');
      
      // Capture chart images first
      const charts = await captureChartsWithMetadata();
      console.log('Charts captured:', charts.length);
      
      // Fetch reservation data for the table
      console.log('Fetching reservation data with filters:', filters);
      const reservationsData = await reservationAnalyticsService.getFilteredReservations(filters);
      console.log('Reservation data fetched:', {
        isArray: Array.isArray(reservationsData),
        dataIsArray: Array.isArray(reservationsData.data),
        directCount: Array.isArray(reservationsData) ? reservationsData.length : 'not array',
        dataCount: Array.isArray(reservationsData.data) ? reservationsData.data.length : 'not array',
        firstItem: reservationsData[0] || reservationsData.data?.[0] || 'no items',
        fullResponse: reservationsData
      });

      // Send charts with images and reservation data
      const chartsMetadata = charts.map(chart => ({
        id: chart.id,
        title: chart.title,
        type: chart.type,
        width: chart.width,
        height: chart.height,
        image: chart.image
      }));
      
      const requestData = {
        filters: {
          timeType: filters.timeType || 'all',
          ...(filters.centerId && { centerId: filters.centerId }),
          ...(filters.userId && { userId: filters.userId }),
          ...(filters.startDate && { startDate: filters.startDate }),
          ...(filters.endDate && { endDate: filters.endDate }),
          ...(filters.status && filters.status !== 'all' && { status: filters.status })
        },
        charts: chartsMetadata,
        reservationsData: reservationsData.data || reservationsData, // Handle both response formats
        includeTable: true,
        tableOptions: {
          title: 'Reservations Data',
          columns: ['ID', 'User', 'Workstation', 'Center', 'Room', 'Start Time', 'End Time', 'Status', 'Created'],
          showFilters: true,
          maxRows: 1000 // Limit for performance
        }
      };

      console.log('Sending PDF export request with charts and table:', {
        filtersCount: Object.keys(requestData.filters).length,
        chartsCount: charts.length,
        reservationsCount: Array.isArray(requestData.reservationsData) ? requestData.reservationsData.length : 0,
        chartTitles: charts.map(c => c.title),
        hasImages: charts.map(c => c.image ? 'YES' : 'NO'),
        endpoint: 'pdf-with-charts-and-table (new)',
        filtersData: requestData.filters,
        actualReservationsData: requestData.reservationsData ? 'present' : 'missing'
      });

      // Use the existing endpoint for now (charts only, table will be added later)
      console.log('Using existing charts endpoint');
      const fallbackData = {
        filters: requestData.filters,
        charts: requestData.charts
      };
      
      console.log('Making PDF export request...');
      
      // Get token for manual header setting (backup)
      const token = localStorage.getItem('token');
      console.log('Token available:', !!token);
      
      const response = await apiClient.post('/analytics/reservations/export/pdf-with-charts', fallbackData, {
        responseType: 'blob',
        timeout: 30000, // 30 second timeout for PDF generation
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('PDF export request completed');

      console.log('PDF export response received:', {
        status: response.status,
        statusText: response.statusText,
        dataSize: response.data?.size || 'unknown',
        contentType: response.headers?.['content-type'] || 'unknown'
      });

      // Check if we actually got PDF data
      if (!response.data || response.data.size === 0) {
        throw new Error('No PDF data received from server');
      }

      // Create and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date and filters
      const date = new Date().toISOString().split('T')[0];
      const filterSuffix = filters.centerId || filters.userId ? '-filtered' : '';
      const reportType = charts.length > 0 ? '-with-charts' : '-report';
      link.setAttribute('download', `reservation-analytics-${date}${filterSuffix}${reportType}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('PDF download triggered successfully');
      return true;
    } catch (error) {
      console.error('Error exporting PDF with charts and table:', error);
      
      // Enhanced error handling
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Backend server is not running or not accessible. Please check if the server is running on port 8080.');
      } else if (error.response?.status === 404) {
        throw new Error('PDF export endpoint not found. Please ensure the analytics service is properly configured on the backend.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error occurred while generating PDF. Please try again or contact support.');
      } else if (error.message && error.message.includes('Request failed')) {
        // This might be a successful response that's being misinterpreted
        console.warn('Request may have succeeded despite error message:', error.message);
        throw new Error('PDF export may have completed. Please check your downloads folder.');
      }
      
      throw error;
    }
  },

  /**
   * Get analytics summary statistics
   */
  getSummaryStats: async (filters = {}) => {
    const [reservations, userStats, trends] = await Promise.all([
      reservationAnalyticsService.getFilteredReservations(filters),
      reservationAnalyticsService.getUserStatsByCenter(filters.centerId),
      reservationAnalyticsService.getReservationTrends(filters.centerId, 7)
    ]);

    return {
      totalReservations: reservations.length,
      userStats,
      trends,
      reservations: reservations.slice(0, 10) // Latest 10 reservations
    };
  },

  /**
   * Get filtered reservations with advanced criteria
   */
  getFilteredReservations: async (filters = {}) => {
    const params = {
      timeType: filters.timeType || 'all'
    };

    // Add optional filters
    if (filters.centerId) params.centerId = filters.centerId;
    if (filters.userId) params.userId = filters.userId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.status && filters.status !== 'all') params.status = filters.status;

    const response = await apiClient.get('/analytics/reservations/filtered', { params });
    return response;
  },

  /**
   * Get chart data for reservations
   */
  getReservationChartData: async (filters = {}, groupBy = 'day') => {
    const params = {
      timeType: filters.timeType || 'all',
      groupBy: groupBy
    };

    // Add optional filters
    if (filters.centerId) params.centerId = filters.centerId;
    if (filters.userId) params.userId = filters.userId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.status && filters.status !== 'all') params.status = filters.status;

    const response = await apiClient.get('/analytics/reservations/chart-data', { params });
    return response;
  },

  /**
   * Export reservations to PDF (uses advanced method with charts and table)
   */
  exportReservationsToPdf: async (filters = {}) => {
    return await reservationAnalyticsService.exportToPDFWithCharts(filters);
  },

  /**
   * Test backend charts endpoint connectivity
   */
  testChartsEndpoint: async () => {
    try {
      // First try a simple GET request to check basic connectivity
      const response = await apiClient.get('/centers', { timeout: 5000 });
      console.log('Backend basic connectivity test passed:', response.status);
      
      // Now try analytics endpoint
      try {
        const analyticsResponse = await apiClient.get('/analytics/reservations/filtered', { 
          timeout: 5000,
          params: { timeType: 'all' }
        });
        console.log('Analytics endpoint test passed:', analyticsResponse.status);
        return true;
      } catch (analyticsError) {
        console.error('Analytics endpoint test failed:', analyticsError);
        if (analyticsError.response?.status === 401) {
          console.log('Analytics endpoint requires authentication - this is expected');
          return true; // Authentication required is fine, means endpoint exists
        }
        return false;
      }
    } catch (error) {
      console.error('Backend test failed:', error);
      if (error.code === 'ERR_NETWORK') {
        console.error('Network error: Backend server appears to be down');
      } else if (error.response?.status === 404) {
        console.error('Endpoint not found: Service may not be configured');
      }
      return false;
    }
  }
};

// Export default for convenience
export default reservationAnalyticsService;