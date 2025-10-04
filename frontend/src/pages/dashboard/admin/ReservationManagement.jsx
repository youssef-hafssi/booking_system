import React, { useState, useEffect } from 'react';
import { reservationService, workstationService, userService, centerService } from '../../../services/api';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { Table, Tabs, DateRangePicker, Input, Select, Button, Modal, Alert, Badge } from '../../../components/ui';
import { FiFilter, FiRefreshCw, FiCheck, FiX, FiEdit, FiPlus, FiEye } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import CancellationModal from '../../../components/CancellationModal';

const statusColors = {
  PENDING: 'yellow',
  CONFIRMED: 'green',
  CANCELLED: 'red',
  COMPLETED: 'blue',
  REJECTED: 'gray'
};

const ReservationManagement = () => {
  // State management
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [centers, setCenters] = useState([]);
  const [workstations, setWorkstations] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState(null);
  const [cancellationLoading, setCancellationLoading] = useState(false);
  
  // Get user from auth context
  const { user } = useAuth();
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    centerId: '',
    workstationId: '',
    userId: '',
    dateRange: {
      startDate: new Date(),
      endDate: addDays(new Date(), 30),
    },
    searchTerm: ''
  });
  
  // Fetch current user and all required data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Step 1: Get the current user
        let currentUserData = null;
        try {
          const userResponse = await userService.getCurrentUser();
          currentUserData = userResponse.data;
          setCurrentUser(currentUserData);
          console.log("Current user loaded:", currentUserData?.role);
        } catch (userError) {
          console.error('Error fetching current user:', userError);
          // Continue without user data, treating as admin/global role
        }
        
        // Step 2: Load centers data - needed for all roles
        const centersResponse = await centerService.getAllCenters();
        setCenters(centersResponse.data);
        console.log(`Loaded ${centersResponse.data.length} centers`);
        
        // Step 3: Load other data based on role
        if (currentUserData?.role === 'CENTER_MANAGER' && currentUserData?.assignedCenter) {
          // For CENTER_MANAGER, only load data from their center
          const centerId = currentUserData.assignedCenter.id;
          console.log(`Loading data for CENTER_MANAGER with center ID: ${centerId}`);
          
          // Set the center filter immediately
          setFilters(prev => ({
            ...prev,
            centerId: centerId.toString()
          }));
          
          // Load center-specific reservations directly from the endpoint
          const reservationsResponse = await reservationService.getReservationsByCenter(centerId);
          console.log(`Loaded ${reservationsResponse.data.length} reservations for center ${centerId}`);
          setReservations(reservationsResponse.data);
          setFilteredReservations(reservationsResponse.data);
          
          // Load center-specific workstations
          const workstationsResponse = await workstationService.getWorkstationsByCenter(centerId);
          console.log(`Loaded ${workstationsResponse.data.length} workstations for center ${centerId}`);
          setWorkstations(workstationsResponse.data);
        } else {
          // For admins and other global roles, load all data
          console.log("Loading all data (admin mode)");
          
          // Load all reservations
          const reservationsResponse = await reservationService.getAllReservations();
          console.log(`Loaded ${reservationsResponse.data.length} reservations (all centers)`);
          setReservations(reservationsResponse.data);
          setFilteredReservations(reservationsResponse.data);
          
          // Load all workstations
          const workstationsResponse = await workstationService.getAllWorkstations();
          console.log(`Loaded ${workstationsResponse.data.length} workstations (all centers)`);
          setWorkstations(workstationsResponse.data);
        }
        
        // Load users data for all roles
        const usersResponse = await userService.getAllUsers();
        setUsers(usersResponse.data);
        console.log(`Loaded ${usersResponse.data.length} users`);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Apply filters when filter state changes
  useEffect(() => {
    applyFilters();
  }, [filters, reservations]);
  
  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Apply all active filters
  const applyFilters = () => {
    let filtered = [...reservations];
    
    // If current user is a CENTER_MANAGER, first filter to only their center's reservations
    if (currentUser && currentUser.role === 'CENTER_MANAGER' && currentUser.assignedCenter) {
      const centerId = currentUser.assignedCenter.id;
      filtered = filtered.filter(reservation => {
        // Check if this reservation belongs to the manager's center
        return (
          reservation.workStation?.centerId === centerId ||
          reservation.workStation?.room?.center?.id === centerId ||
          reservation.workStation?.room?.centerId === centerId
        );
      });
    }
    
    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(reservation => reservation.status === filters.status);
    }
    
    // Filter by center - handle all possible center ID paths
    if (filters.centerId) {
      const centerId = parseInt(filters.centerId);
      filtered = filtered.filter(reservation => {
        // Log for debugging
        if (reservation.id === 1) {
          console.log('Filtering by center, reservation structure:', {
            workStation: reservation.workStation,
            possiblePaths: {
              path1: reservation.workStation?.centerName,
              path2: reservation.workStation?.centerId,
              path3: reservation.workStation?.room?.center?.id,
              path4: reservation.workStation?.room?.centerId
            }
          });
        }
        
        return (
          reservation.workStation?.centerId === centerId ||
          reservation.workStation?.room?.center?.id === centerId ||
          reservation.workStation?.room?.centerId === centerId
        );
      });
    }
    
    // Filter by workstation
    if (filters.workstationId) {
      const wsId = parseInt(filters.workstationId);
      filtered = filtered.filter(reservation => 
        reservation.workStation?.id === wsId ||
        reservation.workStationId === wsId
      );
    }
    
    // Filter by user
    if (filters.userId) {
      const uId = parseInt(filters.userId);
      filtered = filtered.filter(reservation => 
        reservation.user?.id === uId ||
        reservation.userId === uId
      );
    }
    
    // Filter by date range
    if (filters.dateRange.startDate && filters.dateRange.endDate) {
      const startDate = new Date(filters.dateRange.startDate);
      const endDate = new Date(filters.dateRange.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(reservation => {
        // Parse the reservation dates
        try {
          const reservationStart = parseISO(reservation.startTime);
          const reservationEnd = parseISO(reservation.endTime);
          
          // Check if the reservation overlaps with the filter date range
          return (
            (isAfter(reservationEnd, startDate) || reservationEnd.getTime() === startDate.getTime()) &&
            (isBefore(reservationStart, endDate) || reservationStart.getTime() === endDate.getTime())
          );
        } catch (error) {
          console.error('Error parsing reservation dates:', error);
          return false;
        }
      });
    }
    
    // Filter by search term (workstation name or user name)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(reservation => {
        // Check all possible text fields
        return (
          // Workstation fields
          reservation.workStation?.name?.toLowerCase().includes(term) ||
          
          // User fields
          reservation.user?.firstName?.toLowerCase().includes(term) ||
          reservation.user?.lastName?.toLowerCase().includes(term) ||
          reservation.user?.email?.toLowerCase().includes(term) ||
          
          // Notes field
          reservation.notes?.toLowerCase().includes(term) ||
          
          // IDs as strings for simple ID searches
          String(reservation.id).includes(term) ||
          String(reservation.workStation?.id).includes(term) ||
          String(reservation.user?.id).includes(term)
        );
      });
    }
    
    setFilteredReservations(filtered);
  };
  
  // Reset all filters
  const resetFilters = () => {
    // If CENTER_MANAGER, keep center filtering on reset
    if (currentUser && currentUser.role === 'CENTER_MANAGER' && currentUser.assignedCenter) {
      setFilters({
        status: '',
        centerId: currentUser.assignedCenter.id.toString(), // Keep the center filter for CENTER_MANAGER
        workstationId: '',
        userId: '',
        dateRange: {
          startDate: new Date(),
          endDate: addDays(new Date(), 30),
        },
        searchTerm: ''
      });
    } else {
      // For other users, reset all filters
      setFilters({
        status: '',
        centerId: '',
        workstationId: '',
        userId: '',
        dateRange: {
          startDate: new Date(),
          endDate: addDays(new Date(), 30),
        },
        searchTerm: ''
      });
    }
  };
  
  // Function to check if a workstation belongs to a specific center
  const isWorkstationInCenter = (workstation, centerId) => {
    if (!workstation) return false;
    if (!centerId) return true;
    
    const wsCenter = 
      workstation.centerId || 
      workstation.room?.center?.id || 
      workstation.room?.centerId;
      
    return wsCenter === centerId;
  }
  
  // Function to check if a reservation belongs to a specific center
  const isReservationInCenter = (reservation, centerId) => {
    if (!reservation) return false;
    if (!centerId) return true;
    
    return isWorkstationInCenter(reservation.workStation, centerId);
  }
  
  // Guard function to ensure CENTER_MANAGER users can only perform actions on their center's reservations
  const guardCenterAction = (reservation, action) => {
    // If not a CENTER_MANAGER or no reservation, allow the action
    if (!currentUser || currentUser.role !== 'CENTER_MANAGER' || !currentUser.assignedCenter) {
      return true;
    }
    
    // Check if the reservation belongs to the CENTER_MANAGER's center
    const isAllowed = isReservationInCenter(
      reservation, 
      currentUser.assignedCenter.id
    );
    
    if (!isAllowed) {
      console.error(`CENTER_MANAGER attempted unauthorized action on reservation ${reservation.id} from another center`);
      setError("You don't have permission to manage reservations from other centers");
      return false;
    }
    
    return true;
  }
  
  // Check if user can cancel with reason (authorized roles)
  const canCancelWithReason = (user) => {
    return user && [
      'PEDAGOGICAL_MANAGER', 
      'ASSET_MANAGER', 
      'EXECUTIVE_DIRECTOR', 
      'ADMIN'
    ].includes(user.role);
  };

  // Handle reservation actions with guard
  const handleReservationAction = async (id, action) => {
    setLoading(true);
    try {
      // Find the reservation
      const reservation = reservations.find(r => r.id === id);
      
      // Check permissions
      if (!guardCenterAction(reservation, action)) {
        setLoading(false);
        return;
      }
      
      let response;
      
      switch (action) {
        case 'approve':
          response = await reservationService.updateReservationStatus(id, 'CONFIRMED');
          setSuccess('Reservation approved successfully');
          break;
        case 'reject':
          response = await reservationService.updateReservationStatus(id, 'REJECTED');
          setSuccess('Reservation rejected successfully');
          break;
        case 'cancel':
          // Check if user can cancel with reason
          if (canCancelWithReason(user || currentUser)) {
            // Open cancellation modal for authorized users
            setReservationToCancel(reservation);
            setIsCancellationModalOpen(true);
            setLoading(false);
            return; // Don't process cancellation here, wait for modal
          } else {
            // Regular cancellation for other users
            response = await reservationService.cancelReservation(id);
            setSuccess('Reservation cancelled successfully');
          }
          break;
        default:
          throw new Error('Unknown action');
      }
      
      // Update the specific reservation in the list
      setReservations(prev => 
        prev.map(r => r.id === id ? response.data : r)
      );
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
      setError(`Failed to ${action} reservation. ${error.response?.data?.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancellation with reason
  const handleCancellationWithReason = async (reason) => {
    setCancellationLoading(true);
    try {
      const response = await reservationService.cancelReservationWithReason(
        reservationToCancel.id,
        reason
      );
      
      // Update the reservation in the list
      setReservations(prev => 
        prev.map(r => r.id === reservationToCancel.id ? response.data : r)
      );
      
      setSuccess('Reservation cancelled successfully with reason provided');
      setIsCancellationModalOpen(false);
      setReservationToCancel(null);
    } catch (error) {
      console.error('Error cancelling reservation with reason:', error);
      setError(`Failed to cancel reservation. ${error.response?.data?.message || 'Please try again.'}`);
    } finally {
      setCancellationLoading(false);
    }
  };

  // Close cancellation modal
  const handleCloseCancellationModal = () => {
    setIsCancellationModalOpen(false);
    setReservationToCancel(null);
  };
  
  // View reservation details
  const handleViewReservation = (reservation) => {
    console.log('Viewing reservation:', reservation);
    
    // For viewing, allow all users to see details
    // Only restrict if CENTER_MANAGER and reservation is from different center
    if (currentUser && currentUser.role === 'CENTER_MANAGER' && currentUser.assignedCenter) {
      const isAllowed = isReservationInCenter(reservation, currentUser.assignedCenter.id);
      if (!isAllowed) {
        setError("You don't have permission to view reservations from other centers");
        return;
      }
    }
    
    // Clear any existing selection first, then set new selection
    setSelectedReservation(null);
    setIsModalOpen(false);
    
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      setSelectedReservation(reservation);
      setIsModalOpen(true);
      console.log('Modal should open now, selectedReservation set to:', reservation);
    }, 0);
  };
  
  // Modal close handler
  const handleCloseModal = () => {
    console.log('Closing modal');
    setIsModalOpen(false);
    setSelectedReservation(null);
  };

  // Debug modal state
  useEffect(() => {
    console.log('Modal state changed:', {
      isModalOpen,
      hasSelectedReservation: !!selectedReservation,
      selectedReservationId: selectedReservation?.id
    });
  }, [isModalOpen, selectedReservation]);

  // Get workstation name safely
  const getWorkstationName = (reservation) => {
    return reservation?.workStation?.name || 'Unknown Workstation';
  };
  
  // Get room and center name safely
  const getLocationInfo = (reservation) => {
    console.log("Getting location info for reservation:", reservation.id, reservation.workStation);
    
    // Handle the complete workstation object path
    const centerName = 
      reservation?.workStation?.centerName || 
      reservation?.workStation?.room?.center?.name || 
      'Unknown Center';
    
    const roomName = 
      reservation?.workStation?.roomName || 
      reservation?.workStation?.room?.name || 
      'Unknown Room';
    
    return `${centerName} / ${roomName}`;
  };
  
  // Get user name safely
  const getUserName = (reservation) => {
    if (reservation.user) {
      return `${reservation.user.firstName} ${reservation.user.lastName}`;
    }
    
    // Look up user from users array
    const user = users.find(u => u.id === reservation.userId);
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    return `User #${reservation.userId || 'Unknown'}`;
  };

  // Set initial filters when user data loads
  useEffect(() => {
    if (currentUser && currentUser.role === 'CENTER_MANAGER' && currentUser.assignedCenter) {
      console.log('Setting initial center filter for CENTER_MANAGER to center ID:', currentUser.assignedCenter.id);
      
      // Set the center ID in the filters
      setFilters(prev => ({
        ...prev,
        centerId: currentUser.assignedCenter.id.toString()
      }));
      
      // Force filtering by center ID for CENTER_MANAGER users
      if (reservations.length > 0) {
        const centerId = currentUser.assignedCenter.id;
        const centerFilteredReservations = reservations.filter(reservation => 
          isReservationInCenter(reservation, centerId)
        );
        
        console.log(`Re-filtered to ${centerFilteredReservations.length} reservations for center ${centerId}`);
        setFilteredReservations(centerFilteredReservations);
      }
    }
  }, [currentUser]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reservation Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage all workstation reservations</p>
        
        {/* Reserve button - only visible to roles that can create reservations */}
        {currentUser?.role !== 'CENTER_MANAGER' && (
           <Button 
            variant="solid" 
            color="blue"
            className="mt-4"
            onClick={() => {
              // Navigate to reservation creation page
              // Implementation depends on your routing setup
            }}
          >
            <FiPlus className="mr-2" /> Reserve Workstation
          </Button>
        )}
      </div>
      
      {/* Alerts */}
      {success && (
        <Alert type="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert type="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <FiFilter className="mr-2" /> Filters
          </h2>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <FiRefreshCw className="mr-2" /> Reset
          </Button>
        </div>
        
        <div className="space-y-4">
          {/* First row - Main filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <Select 
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </div>
            
            {/* Center filter - only shown for global roles, not for center managers */}
            {(!currentUser || currentUser.role !== 'CENTER_MANAGER') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Center
                </label>
                <Select 
                  value={filters.centerId}
                  onChange={(e) => handleFilterChange('centerId', e.target.value)}
                >
                  <option value="">All Centers</option>
                  {centers.map(center => (
                    <option key={center.id} value={center.id}>{center.name}</option>
                  ))}
                </Select>
              </div>
            )}
            
            {/* If this is a center manager, show which center they're viewing */}
            {currentUser && currentUser.role === 'CENTER_MANAGER' && currentUser.assignedCenter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Center (Your Center)
                </label>
                <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-200 font-medium">
                  {currentUser.assignedCenter.name}
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Workstation
              </label>
              <Select 
                value={filters.workstationId}
                onChange={(e) => handleFilterChange('workstationId', e.target.value)}
              >
                <option value="">All Workstations</option>
                {workstations
                  // Filter the workstations to show only those in the selected center or for CENTER_MANAGER's center
                  .filter(ws => {
                    // If a center filter is applied, show only workstations in that center
                    if (filters.centerId) {
                      const centerId = parseInt(filters.centerId);
                      return (
                        ws.centerId === centerId || 
                        ws.room?.center?.id === centerId || 
                        ws.room?.centerId === centerId
                      );
                    }
                    return true; // If no center filter, show all workstations
                  })
                  .map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))
                }
              </Select>
            </div>
          </div>
          
          {/* Second row - Date Range and Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Range
              </label>
              <DateRangePicker 
                value={filters.dateRange}
                onChange={(range) => handleFilterChange('dateRange', range)}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <Input
                type="text"
                placeholder="Search by workstation, user, notes..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Reservations Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>Workstation</Table.HeaderCell>
              <Table.HeaderCell>Location</Table.HeaderCell>
              <Table.HeaderCell>User</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Time</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {loading ? (
              <Table.Row>
                <Table.Cell colSpan={8} className="text-center py-6">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                </Table.Cell>
              </Table.Row>
            ) : filteredReservations.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={8} className="text-center py-6 text-gray-500 dark:text-gray-400">
                  No reservations found
                </Table.Cell>
              </Table.Row>
            ) : (
              // Final security check for CENTER_MANAGER: only show reservations for their center
              filteredReservations
                .filter(reservation => {
                  // If user is CENTER_MANAGER, only show reservations for their center
                  if (currentUser?.role === 'CENTER_MANAGER' && currentUser?.assignedCenter) {
                    const centerId = currentUser.assignedCenter.id;
                    const reservationCenterId = 
                      reservation.workStation?.centerId || 
                      reservation.workStation?.room?.center?.id || 
                      reservation.workStation?.room?.centerId;
                    
                    return reservationCenterId === centerId;
                  }
                  return true; // For other roles, show all
                })
                .map(reservation => (
                  <Table.Row key={reservation.id}>
                    <Table.Cell>{reservation.id}</Table.Cell>
                    <Table.Cell>{getWorkstationName(reservation)}</Table.Cell>
                    <Table.Cell>{getLocationInfo(reservation)}</Table.Cell>
                    <Table.Cell>{getUserName(reservation)}</Table.Cell>
                    <Table.Cell>{format(parseISO(reservation.startTime), 'MMM d, yyyy')}</Table.Cell>
                    <Table.Cell>
                      {format(parseISO(reservation.startTime), 'h:mm a')} - {format(parseISO(reservation.endTime), 'h:mm a')}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[reservation.status] || 'gray'}>
                        {reservation.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            console.log('Eye button clicked for reservation:', reservation.id);
                            handleViewReservation(reservation);
                          }}
                          title="View Details"
                        >
                          <FiEye />
                        </Button>
                        
                        {reservation.status === 'PENDING' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              color="green"
                              onClick={() => handleReservationAction(reservation.id, 'approve')}
                              title="Approve"
                            >
                              <FiCheck />
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              color="red"
                              onClick={() => handleReservationAction(reservation.id, 'reject')}
                              title="Reject"
                            >
                              <FiX />
                            </Button>
                          </>
                        )}
                        
                        {reservation.status !== 'CANCELLED' && reservation.status !== 'REJECTED' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            color="yellow"
                            onClick={() => handleReservationAction(reservation.id, 'cancel')}
                            title="Cancel"
                          >
                            <FiX />
                          </Button>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
            )}
          </Table.Body>
        </Table>
      </div>
      
      {/* Reservation Details Modal */}
      <Modal
        isOpen={isModalOpen && selectedReservation !== null}
        onClose={handleCloseModal}
        title="Reservation Details"
      >
        {selectedReservation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Workstation</p>
                <p className="font-medium">{getWorkstationName(selectedReservation)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <Badge color={statusColors[selectedReservation.status] || 'gray'}>
                  {selectedReservation.status}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                <p className="font-medium">{getLocationInfo(selectedReservation)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">User</p>
                <p className="font-medium">{getUserName(selectedReservation)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Start Time</p>
                <p className="font-medium">
                  {format(parseISO(selectedReservation.startTime), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">End Time</p>
                <p className="font-medium">
                  {format(parseISO(selectedReservation.endTime), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              
              <div className="col-span-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                <p className="font-medium">{selectedReservation.notes || 'No notes provided'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
                <p className="font-medium">
                  {selectedReservation.createdAt ? 
                    format(parseISO(selectedReservation.createdAt), 'MMM d, yyyy h:mm a') : 
                    'Unknown'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Updated At</p>
                <p className="font-medium">
                  {selectedReservation.updatedAt ? 
                    format(parseISO(selectedReservation.updatedAt), 'MMM d, yyyy h:mm a') : 
                    'Unknown'}
                </p>
              </div>
              
              {/* Cancellation Details - show if reservation was cancelled */}
              {selectedReservation.status === 'CANCELLED' && (
                <>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cancellation Reason</p>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-1">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        {selectedReservation.cancellationReason || 'No reason provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cancelled By</p>
                    <p className="font-medium">
                      {selectedReservation.cancelledBy ? (
                        <>
                          {selectedReservation.cancelledBy.firstName} {selectedReservation.cancelledBy.lastName}
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            ({selectedReservation.cancelledBy.role})
                          </span>
                        </>
                      ) : (
                        'Unknown'
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cancelled At</p>
                    <p className="font-medium">
                      {selectedReservation.cancelledAt ? 
                        format(parseISO(selectedReservation.cancelledAt), 'MMM d, yyyy h:mm a') : 
                        'Unknown'}
                    </p>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              {selectedReservation.status === 'PENDING' && (
                <>
                  <Button 
                    onClick={() => {
                      handleReservationAction(selectedReservation.id, 'approve');
                      handleCloseModal();
                    }}
                    color="green"
                  >
                    <FiCheck className="mr-2" /> Approve
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      handleReservationAction(selectedReservation.id, 'reject');
                      handleCloseModal();
                    }}
                    color="red"
                    variant="outline"
                  >
                    <FiX className="mr-2" /> Reject
                  </Button>
                </>
              )}
              
              {selectedReservation.status !== 'CANCELLED' && selectedReservation.status !== 'REJECTED' && (
                <Button 
                  onClick={() => {
                    handleReservationAction(selectedReservation.id, 'cancel');
                    handleCloseModal();
                  }}
                  color="yellow"
                  variant="outline"
                >
                  <FiX className="mr-2" /> Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Cancellation Modal */}
      {isCancellationModalOpen && reservationToCancel && (
        <CancellationModal
          isOpen={isCancellationModalOpen}
          onClose={handleCloseCancellationModal}
          onConfirm={handleCancellationWithReason}
          loading={cancellationLoading}
          reservation={reservationToCancel}
        />
      )}
    </div>
  );
};

export default ReservationManagement; 