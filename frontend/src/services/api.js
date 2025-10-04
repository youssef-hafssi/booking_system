import axios from 'axios';
import { reservationAnalyticsService } from './analyticsService';

export const API_URL = 'http://localhost:8080/api';

// Create an axios instance with default config
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include the auth token in every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If 401 Unauthorized, clear token and redirect to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Penalty services
export const penaltyService = {
  getOverallStats: () => {
    return apiClient.get('/penalties/stats');
  },
  getUserPenaltyStats: (userId) => {
    return apiClient.get(`/penalties/stats/${userId}`);
  },
  removeStrike: (userId) => {
    return apiClient.post(`/penalties/remove-strike/${userId}`);
  },
  resetStrikes: (userId) => {
    return apiClient.post(`/penalties/reset-strikes/${userId}`);
  },
  addManualStrike: (userId, reason) => {
    return apiClient.post(`/penalties/add-strike/${userId}`, null, {
      params: { reason }
    });
  },
  markReservationAsNoShow: (reservationId) => {
    return apiClient.post(`/penalties/mark-no-show/${reservationId}`);
  },
  getBadUsers: () => {
    return apiClient.get('/penalties/bad-users');
  },
  getWarningUsers: () => {
    return apiClient.get('/penalties/warning-users');
  },
  getTopOffenders: (limit = 10) => {
    return apiClient.get('/penalties/top-offenders', {
      params: { limit }
    });
  },
  canUserMakeReservations: (userId) => {
    return apiClient.get(`/penalties/can-reserve/${userId}`);
  }
};

// Authentication services
export const authService = {
  login: (credentials) => {
    return apiClient.post('/auth/login', credentials);
  },
  register: (userData) => {
    return apiClient.post('/auth/register', userData);
  },
  validateToken: () => {
    return apiClient.get('/auth/validate');
  },
};

// User services
export const userService = {
  getCurrentUser: () => {
    return apiClient.get('/users/current');
  },
  getUserById: (id) => {
    return apiClient.get(`/users/${id}`);
  },
  getUserByEmail: (email) => {
    return apiClient.get(`/users/email/${email}`);
  },
  updateUser: (id, userData) => {
    return apiClient.put(`/users/${id}`, userData);
  },
  getAllUsers: () => {
    return apiClient.get('/users');
  },
  getUsersByRole: (role) => {
    return apiClient.get(`/users/role/${role}`);
  },
  getUsersByCenter: (centerId, page = 0, size = 10) => {
    return apiClient.get(`/users/center/${centerId}`, {
      params: { page, size }
    });
  },
};

// Workstation services
export const workstationService = {
  getAllWorkstations: () => {
    return apiClient.get('/workstations');
  },
  getWorkstationById: (id) => {
    return apiClient.get(`/workstations/${id}`);
  },
  getWorkstationsByCenter: (centerId) => {
    return apiClient.get(`/workstations/center/${centerId}`);
  },
  getAvailableWorkstations: (startTime, endTime, centerId) => {
    return apiClient.get('/workstations/available', {
      params: { startTime, endTime, centerId }
    });
  },
  createWorkstation: (workstationData) => {
    return apiClient.post('/workstations', workstationData);
  },
  updateWorkstation: (id, workstationData) => {
    return apiClient.put(`/workstations/${id}`, workstationData);
  },
  deleteWorkstation: (id) => {
    return apiClient.delete(`/workstations/${id}`);
  }
};

// Reservation services
export const reservationService = {
  getAllReservations: () => {
    return apiClient.get('/reservations');
  },
  getReservationById: (id) => {
    return apiClient.get(`/reservations/${id}`);
  },
  getUserReservations: (userId) => {
    return apiClient.get(`/reservations/user/${userId}`);
  },
  getUserReservationStats: (userId) => {
    return apiClient.get(`/reservations/user/${userId}/stats`).catch(error => {
      // Return default stats object if endpoint fails
      console.warn('Failed to fetch user stats, using default values:', error);
      return {
        data: {
          activeReservations: 0,
          upcomingReservations: 0,
          pastReservations: 0,
          favoriteWorkstations: []
        }
      };
    });
  },
  getUpcomingUserReservations: (userId) => {
    return apiClient.get(`/reservations/user/${userId}/upcoming`);
  },
  getWorkstationReservations: (workStationId) => {
    return apiClient.get(`/reservations/workstation/${workStationId}`);
  },
  getReservationsByCenter: (centerId) => {
    return apiClient.get(`/reservations/center/${centerId}`);
  },
  getReservationsByStatus: (status) => {
    return apiClient.get(`/reservations/status/${status}`);
  },
  getReservationsInDateRange: (startTime, endTime) => {
    return apiClient.get('/reservations/daterange', {
      params: { startTime, endTime },
    });
  },
  createReservation: (reservationData) => {
    return apiClient.post('/reservations', reservationData);
  },
  updateReservation: (id, reservationData) => {
    return apiClient.patch(`/reservations/${id}`, reservationData);
  },
  updateReservationStatus: (id, status) => {
    return apiClient.patch(`/reservations/${id}/status`, {}, {
      params: { status },
    });
  },
  cancelReservation: (id) => {
    return apiClient.post(`/reservations/${id}/cancel`);
  },
  cancelReservationWithReason: (id, reason) => {
    return apiClient.post(`/reservations/${id}/cancel-with-reason`, { reason });
  },
  deleteReservation: (id) => {
    return apiClient.delete(`/reservations/${id}`);
  },
  checkAvailability: (workStationId, startTime, endTime) => {
    return apiClient.get('/reservations/check-availability', {
      params: { workStationId, startTime, endTime },
    });
  },
  canCancelReservation: (id) => {
    return apiClient.get(`/reservations/${id}/can-cancel`);
  },
  canMakeReservation: (startTime) => {
    return apiClient.get('/reservations/can-reserve', {
      params: { startTime: startTime.toISOString() },
    });
  },
  validateReservationDuration: (startTime, endTime) => {
    return apiClient.get('/reservations/validate-duration', {
      params: { 
        startTime: startTime.toISOString(), 
        endTime: endTime.toISOString() 
      },
    });
  },
  hasActiveReservations: () => {
    return apiClient.get('/reservations/has-active');
  },
  getTimeSlots: (workStationId, date) => {
    // Format date as yyyy-MM-dd using local timezone to avoid UTC conversion issues
    let dateStr;
    if (date instanceof Date) {
      // Use local date to avoid timezone conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    } else {
      dateStr = date;
    }
    
    console.log('API call - getTimeSlots:', { workStationId, date: dateStr, originalDate: date });
    return apiClient.get('/reservations/time-slots', {
      params: { workStationId, date: dateStr },
    }).then(response => {
      console.log('API response - getTimeSlots:', response.data);
      return response;
    }).catch(error => {
      console.error('API error - getTimeSlots:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    });
  }
};

// Center and Room services
export const centerService = {
  getAllCenters: () => {
    return apiClient.get('/centers');
  },
  getCenterById: (id) => {
    return apiClient.get(`/centers/${id}`);
  },
  getRoomsByCenterId: (centerId) => {
    console.log(`Calling getRoomsByCenterId API with centerId: ${centerId}`);
    // First try the standard endpoint
    return apiClient.get(`/centers/${centerId}/rooms`)
      .catch(error => {
        console.error(`Error with standard rooms endpoint: ${error.message}`);
        // If the standard endpoint fails, try the fallback endpoint
        return apiClient.get(`/rooms/center/${centerId}`)
          .catch(fallbackError => {
            console.error(`Error with fallback rooms endpoint: ${fallbackError.message}`);
            // If both fail, return an empty array to prevent UI crashes
            return { data: [] };
          });
      });
  },
};

// Maintenance services
export const maintenanceService = {
  getAllMaintenances: () => {
    return apiClient.get('/maintenances');
  },
  getCenterMaintenances: (centerId) => {
    return apiClient.get(`/maintenances/center/${centerId}`);
  },
  getMaintenanceById: (id) => {
    return apiClient.get(`/maintenances/${id}`);
  },
  createMaintenance: (maintenanceData) => {
    return apiClient.post('/maintenances', maintenanceData);
  },
  updateMaintenance: (id, maintenanceData) => {
    return apiClient.patch(`/maintenances/${id}`, maintenanceData);
  },
  deleteMaintenance: (id) => {
    return apiClient.delete(`/maintenances/${id}`);
  }
};

// AI Recommendation endpoints
export const aiService = {
  generateRecommendations: (recommendationRequest) => {
    return apiClient.post('/ai/recommendations', recommendationRequest);
  },
  
  quickRecommend: (userId, centerId, duration = 2) => {
    return apiClient.post('/ai/quick-recommend', null, {
      params: { userId, centerId, duration }
    });
  },
  
  getUserProfile: (userId) => {
    return apiClient.get(`/ai/profile/${userId}`);
  },
  
  getContextAnalysis: (centerId) => {
    return apiClient.get(`/ai/context/${centerId}`);
  }
};


export default {
  auth: authService,
  users: userService,
  workstations: workstationService,
  reservations: reservationService,
  centers: centerService,
  maintenances: maintenanceService,
  penalties: penaltyService,
  analytics: reservationAnalyticsService,
  ai: aiService
};