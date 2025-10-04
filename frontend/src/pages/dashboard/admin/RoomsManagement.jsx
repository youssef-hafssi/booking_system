import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

const API_URL = 'http://localhost:8080/api';

// MagicUI Components
const MagicCard = ({ className, children }) => {
  const cardRef = useRef(null);
  const [mouseX, setMouseX] = useState(-200);
  const [mouseY, setMouseY] = useState(-200);

  const handleMouseMove = (e) => {
    if (cardRef.current) {
      const { left, top } = cardRef.current.getBoundingClientRect();
      setMouseX(e.clientX - left);
      setMouseY(e.clientY - top);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`relative rounded-xl ${className}`}
      onMouseMove={handleMouseMove}
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-border opacity-0 duration-300 group-hover:opacity-100"
           style={{
             background: `radial-gradient(200px circle at ${mouseX}px ${mouseY}px, rgba(154, 120, 255, 0.4), rgba(255, 123, 123, 0.1), transparent 100%)`,
           }}
      />
      <div className="absolute inset-px rounded-xl bg-background" />
      <div className="pointer-events-none absolute inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
           style={{
             background: `radial-gradient(200px circle at ${mouseX}px ${mouseY}px, rgba(120, 120, 120, 0.1), transparent 100%)`,
             opacity: 0.8,
           }}
      />
      <div className="relative">{children}</div>
    </div>
  );
};

const BlurModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-md rounded-lg p-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-shine">
        <div className="bg-white dark:bg-dark-sidebar rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const ShimmerButton = ({ onClick, className, children, type }) => {
  return (
    <button
      onClick={onClick}
      type={type}
      className={`relative overflow-hidden ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 overflow-visible">
        <div className="absolute h-[100%] w-auto -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      </div>
    </button>
  );
};

const BorderBeam = ({ className }) => {
  return (
    <div className={`pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)] ${className}`}>
      <div
        className="absolute aspect-square bg-gradient-to-l from-purple-500 via-pink-400 to-transparent"
            style={{
              width: '50px',
              offsetPath: 'rect(0 auto auto 0 round 50px)',
              animation: 'moveAlong 6s linear infinite'
            }}
      />
    </div>
  );
};

const RoomsManagement = () => {
  const { token, user } = useAuth();
  const { theme } = useTheme();
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Form state
  const [formMode, setFormMode] = useState('create');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    floor: 0,
    capacity: 0,
    centerId: ''
  });

  // Check if user is a CENTER_MANAGER
  const isCenterManager = user && user.role === 'CENTER_MANAGER';
  
  // Get the assigned center ID for CENTER_MANAGERs
  // Handle different possible data structures
  const userAssignedCenterId = (() => {
    if (!user || !isCenterManager) return null;
    
    // Log user data to help with debugging
    console.log('User data:', user);
    
    if (user.assignedCenter && typeof user.assignedCenter === 'object') {
      return user.assignedCenter.id;
    } else if (user.assignedCenter && typeof user.assignedCenter === 'number') {
      return user.assignedCenter;
    } else if (user.centerId) {
      return user.centerId;
    }
    return null;
  })();
  
  console.log('User role:', user?.role);
  console.log('Is CENTER_MANAGER:', isCenterManager);
  console.log('Assigned center ID:', userAssignedCenterId);
  
  // Load data on component mount
  useEffect(() => {
    fetchCenters();
    fetchRooms();
  }, [user]);

  // Filter rooms whenever rooms change
  useEffect(() => {
    if (rooms.length > 0) {
      filterRoomsBasedOnUserRole();
    }
  }, [rooms, user, isCenterManager, userAssignedCenterId]);
  
  // Filter the rooms based on user role
  const filterRoomsBasedOnUserRole = () => {
    // If user is a CENTER_MANAGER with an assigned center, only show rooms from that center
    if (isCenterManager && userAssignedCenterId) {
      console.log(`Filtering rooms for CENTER_MANAGER with assigned center ID: ${userAssignedCenterId}`);
      
      const filtered = rooms.filter(room => {
        // Check different possible room data structures
        const roomCenterId = getRoomCenterId(room);
        const matches = roomCenterId === userAssignedCenterId;
        
        if (matches) {
          console.log(`Room ${room.id} (${room.name}) matches center ${userAssignedCenterId}`);
        }
        
        return matches;
      });
      
      console.log(`Filtered rooms: ${filtered.length} of ${rooms.length} total rooms`);
      setFilteredRooms(filtered);
    } else {
      // For ADMIN or other roles, show all rooms
      console.log('Showing all rooms for non-CENTER_MANAGER role');
      setFilteredRooms(rooms);
    }
  };
  
  // Helper function to extract the center ID from a room object
  const getRoomCenterId = (room) => {
    if (!room) return null;
    
    // Check different possible room data structures
    if (room.center && typeof room.center === 'object') {
      return room.center.id;
    } else if (room.centerId) {
      return room.centerId;
    }
    
    return null;
  };
  
  const fetchCenters = async () => {
    try {
      const response = await axios.get(`${API_URL}/centers`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Fetched centers:', response.data);
      
      // If user is a CENTER_MANAGER with an assigned center, only show that center
      if (isCenterManager && userAssignedCenterId) {
        const filteredCenters = response.data.filter(center => center.id === userAssignedCenterId);
        console.log(`Filtered centers for CENTER_MANAGER: ${filteredCenters.length} centers`);
        setCenters(filteredCenters);
      } else {
        setCenters(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch centers:', err);
      setError('Failed to fetch centers. Please try again later.');
    }
  };
  
  const fetchRooms = async () => {
    try {
      setLoading(true);
      
      // For CENTER_MANAGER, fetch only rooms from their assigned center
      let url = `${API_URL}/rooms`;
      if (isCenterManager && userAssignedCenterId) {
        url = `${API_URL}/rooms/center/${userAssignedCenterId}`;
        console.log(`Fetching rooms only from center ${userAssignedCenterId}`);
      }
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Fetched rooms:', response.data);
      
      setRooms(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch rooms: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Pre-populate centerId for CENTER_MANAGERs when creating a new room
  useEffect(() => {
    if (isCenterManager && userAssignedCenterId && formMode === 'create') {
      console.log(`Pre-populating form with center ID ${userAssignedCenterId}`);
      setFormData(prev => ({
        ...prev,
        centerId: userAssignedCenterId
      }));
    }
  }, [formMode, isCenterManager, userAssignedCenterId]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for select fields to avoid 0 values
    if (name === 'centerId') {
      // For centerId, use empty string if value is empty, otherwise convert to integer
      const parsedValue = value === '' ? '' : parseInt(value, 10);
      setFormData({
        ...formData,
        [name]: parsedValue
      });
      console.log(`Setting centerId to: ${parsedValue} (original value: ${value})`);
    } else if (name === 'floor' || name === 'capacity') {
      // For other numeric fields, use parseInt with fallback to 0
      setFormData({
        ...formData,
        [name]: parseInt(value, 10) || 0
      });
    } else {
      // For text fields, use the value as is
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const resetForm = () => {
    const initialCenterId = isCenterManager && userAssignedCenterId ? userAssignedCenterId : '';
    
    setFormData({
      name: '',
      floor: 0,
      capacity: 0,
      centerId: initialCenterId
    });
    setFormMode('create');
    setSelectedRoom(null);
    setIsEditModalOpen(false);
  };
  
  const handleEditRoom = (room) => {
    // Verify that CENTER_MANAGERs can only edit rooms in their center
    if (isCenterManager && userAssignedCenterId) {
      const roomCenterId = getRoomCenterId(room);
      if (roomCenterId !== userAssignedCenterId) {
        setError("You don't have permission to edit rooms in other centers");
        return;
      }
    }
    
    console.log('Editing room:', room);
    setSelectedRoom(room);
    const roomCenterId = getRoomCenterId(room);
    
    setFormData({
      name: room.name,
      floor: room.floor,
      capacity: room.capacity,
      centerId: roomCenterId
    });
    setFormMode('edit');
    setIsEditModalOpen(true);
  };
  
  const handleOpenDeleteModal = (room) => {
    // Verify that CENTER_MANAGERs can only delete rooms in their center
    if (isCenterManager && userAssignedCenterId) {
      const roomCenterId = getRoomCenterId(room);
      if (roomCenterId !== userAssignedCenterId) {
        setError("You don't have permission to delete rooms in other centers");
        return;
      }
    }
    
    setRoomToDelete(room);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setRoomToDelete(null);
    setIsDeleteModalOpen(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Log the form data being sent to the server
      console.log('Submitting form data:', {
        ...formData,
        centerId: formData.centerId,
        centerId_type: typeof formData.centerId
      });
      
      // For CENTER_MANAGERs, ensure they can only create/update rooms in their center
      if (isCenterManager && userAssignedCenterId) {
        if (formData.centerId !== userAssignedCenterId) {
          setError("You don't have permission to create or update rooms in other centers");
          return;
        }
      }
      
      if (formMode === 'create') {
        // Create new room
        await axios.post(`${API_URL}/rooms`, formData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // Update existing room
        await axios.put(`${API_URL}/rooms/${selectedRoom.id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      // Refresh rooms
      fetchRooms();
      // Reset form
      resetForm();
      setError(null);
    } catch (err) {
      setError(`Failed to ${formMode} room: ` + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };
  
  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    
    try {
      await axios.delete(`${API_URL}/rooms/${roomToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh rooms
      fetchRooms();
      setError(null);
      handleCloseDeleteModal();
    } catch (err) {
      setError('Failed to delete room: ' + (err.response?.data?.message || err.message));
      console.error(err);
      handleCloseDeleteModal();
    }
  };
  
  // Helper to get center name by ID
  const getCenterName = (centerId) => {
    const center = centers.find(c => c.id === centerId);
    return center ? center.name : 'Unknown';
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rooms Management</h1>
        <ShimmerButton 
          onClick={() => setFormMode('create')}
          className="btn btn-primary relative overflow-hidden transition-all duration-300 hover:shadow-md"
        >
          Create New Room
        </ShimmerButton>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Room Form */}
      {formMode === 'create' && (
        <MagicCard className="mb-6 group bg-white dark:bg-dark-sidebar p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Create New Room
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Room Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Center</label>
                <select
                  name="centerId"
                  value={formData.centerId}
                  onChange={handleInputChange}
                  className="form-select w-full"
                  required
                  disabled={isCenterManager && userAssignedCenterId}
                >
                  <option value="">Select a Center</option>
                  {centers.map(center => (
                    <option key={center.id} value={center.id}>
                      {center.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Floor</label>
                <input
                  type="number"
                  name="floor"
                  value={formData.floor}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  required
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  required
                  min="1"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <ShimmerButton
                type="submit"
                className="btn btn-primary"
              >
                Create Room
              </ShimmerButton>
            </div>
          </form>
        </MagicCard>
      )}
      
      {/* Rooms List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 dark:border-accent-yellow"></div>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Loading rooms...</p>
        </div>
      ) : (
        filteredRooms.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-dark-sidebar">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Room
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Center
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Floor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRooms.map(room => (
                  <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">{room.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {room.center ? room.center.name : getCenterName(room.centerId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {room.floor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {room.capacity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button 
                        onClick={() => handleEditRoom(room)}
                        className="relative overflow-hidden text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 px-3 py-1 rounded"
                      >
                        <span className="relative z-10">Edit</span>
                        <BorderBeam className="opacity-0 hover:opacity-100" />
                      </button>
                      <button 
                        onClick={() => handleOpenDeleteModal(room)}
                        className="relative overflow-hidden text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 px-3 py-1 rounded"
                      >
                        <span className="relative z-10">Delete</span>
                        <BorderBeam className="opacity-0 hover:opacity-100" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No rooms found. Create your first room by clicking the button above.</p>
          </div>
        )
      )}
      
      {/* Edit Modal */}
      <BlurModal
        isOpen={isEditModalOpen}
        onClose={resetForm}
        title="Edit Room"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Room Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input w-full"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Center</label>
              <select
                name="centerId"
                value={formData.centerId}
                onChange={handleInputChange}
                className="form-select w-full"
                required
                disabled={isCenterManager && userAssignedCenterId}
              >
                <option value="">Select a Center</option>
                {centers.map(center => (
                  <option key={center.id} value={center.id}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Floor</label>
                <input
                  type="number"
                  name="floor"
                  value={formData.floor}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  required
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  required
                  min="1"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <ShimmerButton
              type="submit"
              className="btn btn-primary"
            >
              Update Room
            </ShimmerButton>
          </div>
        </form>
      </BlurModal>
      
      {/* Delete Confirmation Modal */}
      <BlurModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete room "{roomToDelete?.name}"? This will also delete all workstations in this room.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCloseDeleteModal}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <ShimmerButton
              onClick={handleDeleteRoom}
              className="btn btn-danger bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </ShimmerButton>
          </div>
        </div>
      </BlurModal>
      
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes moveAlong {
          0% {
            offset-distance: 0%;
          }
          100% {
            offset-distance: 100%;
          }
        }
        
        .animate-shine {
          background-size: 300% 300%;
          animation: shine 4s ease infinite;
        }
        
        @keyframes shine {
          0% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          100% {
            background-position: 0% 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default RoomsManagement; 