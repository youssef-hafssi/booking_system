import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

const API_URL = 'http://localhost:8080/api';

const ReservationsManagement = () => {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering state
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [centerFilter, setCenterFilter] = useState('');
  
  // Reference data
  const [users, setUsers] = useState([]);
  const [workstations, setWorkstations] = useState([]);
  const [centers, setCenters] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  // Load data on component mount
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchReservationsWithDetails(),
          fetchUsers(),
          fetchWorkstationsWithDetails(),
          fetchCenters(),
          fetchRooms()
        ]);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("There was a problem loading data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, []);
  
  // Enhanced fetch reservations with detailed data
  const fetchReservationsWithDetails = async () => {
    try {
      // First, get all reservations
      const response = await axios.get(`${API_URL}/reservations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Raw reservations data:", response.data);
      
      // Process each reservation to ensure workstation details are loaded
      const processedReservations = await Promise.all(
        response.data.map(async (reservation) => {
          // If reservation already has complete workstation data with room and center names
          if (reservation.workStation && 
              reservation.workStation.roomName && 
              reservation.workStation.centerName) {
            return reservation;
          }
          
          // If we need to load workstation details
          if (reservation.workStation && reservation.workStation.id) {
            try {
              // Fetch detailed workstation data that includes room and center
              const wsResponse = await axios.get(`${API_URL}/workstations/${reservation.workStation.id}`, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });
              
              // Merge the detailed workstation data
              reservation.workStation = {
                ...reservation.workStation,
                ...wsResponse.data
              };
              
              console.log(`Enhanced workstation data for reservation ${reservation.id}:`, reservation.workStation);
            } catch (wsError) {
              console.error(`Error fetching workstation details for reservation ${reservation.id}:`, wsError);
            }
          }
          
          return reservation;
        })
      );
      
      setReservations(processedReservations);
      return processedReservations;
    } catch (err) {
      setError('Failed to fetch reservations: ' + (err.response?.data?.message || err.message));
      console.error(err);
      return [];
    }
  };
  
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };
  
  const fetchWorkstationsWithDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/workstations`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          includeRooms: true,
          includeCenters: true
        }
      });
      console.log("Workstations with details:", response.data);
      setWorkstations(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch workstations with details:', err);
      return [];
    }
  };
  
  const fetchCenters = async () => {
    try {
      const response = await axios.get(`${API_URL}/centers`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log("Centers from API:", response.data);
      setCenters(response.data);
    } catch (err) {
      console.error('Failed to fetch centers:', err);
    }
  };
  
  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/rooms`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log("Rooms from API:", response.data);
      setRooms(response.data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };
  
  const handleCancelReservation = async (reservationId) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      try {
        await axios.patch(`${API_URL}/reservations/${reservationId}/status?status=CANCELLED`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Refresh reservations
        fetchReservationsWithDetails();
        setError(null);
      } catch (err) {
        setError('Failed to cancel reservation: ' + (err.response?.data?.message || err.message));
        console.error(err);
      }
    }
  };
  
  // Helpers for display
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  };
  
  // Enhanced workstation details function
  const getWorkstationDetails = (reservation) => {
    // For debugging
    console.log("Processing reservation:", reservation.id);
    
    // Case 1: Reservation has full workStation details
    if (reservation.workStation) {
      console.log("WS details from reservation:", reservation.workStation);
      return {
        workstationName: reservation.workStation.name || 'Unknown Workstation',
        roomName: reservation.workStation.roomName || 'Unknown Room',
        centerName: reservation.workStation.centerName || 'Unknown Center',
        location: `${reservation.workStation.centerName || 'Unknown Center'} / ${reservation.workStation.roomName || 'Unknown Room'}`
      };
    }
    
    // Case 2: We need to look up by ID
    const workstation = reservation.workStationId ? 
      workstations.find(w => w.id === reservation.workStationId) : null;
    
    if (!workstation) {
      return {
        workstationName: 'Unknown Workstation',
        roomName: 'Unknown Room',
        centerName: 'Unknown Center',
        location: 'Unknown Location'
      };
    }
    
    console.log("Found workstation by ID:", workstation);
    
    // Get room from our loaded data
    const room = rooms.find(r => r.id === workstation.roomId);
    
    // Get center from our loaded data
    const center = centers.find(c => c.id === (room?.centerId || workstation.centerId));
    
    return {
      workstationName: workstation.name || 'Unknown Workstation',
      roomName: room?.name || workstation.roomName || 'Unknown Room',
      centerName: center?.name || workstation.centerName || 'Unknown Center',
      location: `${center?.name || workstation.centerName || 'Unknown Center'} / ${room?.name || workstation.roomName || 'Unknown Room'}`
    };
  };
  
  const formatDateTime = (dateTimeString) => {
    const dateTime = new Date(dateTimeString);
    return dateTime.toLocaleString();
  };
  
  // Get status label for display
  const getStatusLabel = (status) => {
    if (!status) return 'UNKNOWN';
    return status;
  };
  
  // Get status class for styling
  const getStatusClass = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };
  
  // Filter reservations
  const filteredReservations = reservations.filter(reservation => {
    if (statusFilter && reservation.status !== statusFilter) {
      return false;
    }
    
    if (dateFilter) {
      const reservationDate = new Date(reservation.startTime).toLocaleDateString();
      const filterDate = new Date(dateFilter).toLocaleDateString();
      if (reservationDate !== filterDate) {
        return false;
      }
    }
    
    if (centerFilter) {
      const details = getWorkstationDetails(reservation);
      if (details.centerName !== centerFilter) {
        return false;
      }
    }
    
    return true;
  });
  
  // Get unique centers for filter
  const uniqueCenters = centers.map(center => center.name).filter(Boolean);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reservations Management</h1>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white dark:bg-dark-sidebar p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Filter Reservations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select w-full"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-input w-full"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Center</label>
            <select
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
              className="form-select w-full"
            >
              <option value="">All Centers</option>
              {uniqueCenters.map(center => (
                <option key={center} value={center}>{center}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Reservations List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 dark:border-accent-yellow"></div>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Loading reservations...</p>
        </div>
      ) : (
        filteredReservations.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-dark-sidebar">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Workstation
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Room
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Center
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    End Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReservations.map(reservation => {
                  const details = getWorkstationDetails(reservation);
                  const statusLabel = getStatusLabel(reservation.status);
                  const statusClass = getStatusClass(reservation.status);
                  
                  return (
                    <tr key={reservation.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {reservation.user ? `${reservation.user.firstName} ${reservation.user.lastName}` : getUserName(reservation.userId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {details.workstationName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {details.roomName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {details.centerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {details.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {formatDateTime(reservation.startTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {formatDateTime(reservation.endTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(reservation.status !== 'CANCELLED' && reservation.status !== 'COMPLETED') && (
                          <button
                            onClick={() => handleCancelReservation(reservation.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No reservations found matching your filters.</p>
          </div>
        )
      )}
      
      <div className="bg-white dark:bg-dark-sidebar rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Coming Soon</h2>
        <p className="text-gray-700 dark:text-gray-300">
          Enhanced reservation management features including:
        </p>
        <ul className="list-disc pl-8 mt-2 text-gray-500 dark:text-gray-400">
          <li>Creating new reservations</li>
          <li>Editing existing reservations</li>
          <li>Managing recurring reservations</li>
          <li>Adding notes to reservations</li>
          <li>Exporting reservation data</li>
        </ul>
      </div>
    </div>
  );
};

export default ReservationsManagement; 