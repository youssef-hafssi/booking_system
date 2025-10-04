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
          animation: 'moveAlong 6s linear infinite',
        }}
      />
    </div>
  );
};

const WorkstationsManagement = () => {
  const { token, user } = useAuth();
  const isCenterManager = user?.role === 'CENTER_MANAGER';
  
  // If user is CENTER_MANAGER, hide create and delete options
  const { theme } = useTheme();
  const [workstations, setWorkstations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workstationToDelete, setWorkstationToDelete] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Form state
  const [formMode, setFormMode] = useState('create');
  const [selectedWorkstation, setSelectedWorkstation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'DESKTOP',
    specifications: '',
    status: 'AVAILABLE',
    roomId: '',
    position: '',
    imageUrl: ''
  });
  
  // Form center selection state
  const [formCenterId, setFormCenterId] = useState('');
  const [formFilteredRooms, setFormFilteredRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  
  // Load data on component mount
  useEffect(() => {
    fetchCenters();
    fetchRooms();
    fetchWorkstations();
  }, []);
  
  // Update form filtered rooms when form center selection changes
  useEffect(() => {
    if (formCenterId) {
      console.log('Form center ID changed to:', formCenterId);
      // Call the dedicated function to fetch rooms for this center
      fetchRoomsByCenter(formCenterId);
    } else {
      setFormFilteredRooms([]);
      // Clear the room selection when center is unselected
      setFormData(prev => ({
        ...prev,
        roomId: ''
      }));
    }
  }, [formCenterId]);
  
  const fetchCenters = async () => {
    try {
      const response = await axios.get(`${API_URL}/centers`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Centers data from API:', response.data);
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
      console.log('Rooms data from API:', response.data);
      
      // Log a sample room to understand structure
      if (response.data && response.data.length > 0) {
        console.log('Sample room structure:', JSON.stringify(response.data[0], null, 2));
        // Check what fields are available in the room object
        logRoomStructure(response.data[0]);
      } else {
        console.warn('No rooms data returned from API');
      }
      
      setRooms(response.data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };
  
  // Helper function to analyze room data structure
  const logRoomStructure = (room) => {
    if (!room) return;
    
    console.log('Room object analysis:');
    console.log('- ID:', room.id, typeof room.id);
    console.log('- Name:', room.name, typeof room.name);
    console.log('- Center ID:', room.centerId, typeof room.centerId);
    
    // Check if centerRef or center object exists
    if (room.center) {
      console.log('- Center object present:', room.center);
    } else if (room.centerRef) {
      console.log('- Center reference present:', room.centerRef);
    }
    
    // List all properties on the room object
    console.log('All properties on room object:', Object.keys(room));
    
    // Check if there's a nested center object with a different field name
    for (const key in room) {
      if (typeof room[key] === 'object' && room[key] !== null) {
        console.log(`- Nested object found at ${key}:`, room[key]);
      }
    }
  };
  
  const fetchWorkstations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/workstations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setWorkstations(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch workstations: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'roomId' ? parseInt(value, 10) || '' : value
    });
  };
  
  const handleFormCenterChange = (e) => {
    const centerId = e.target.value;
    setFormCenterId(centerId);
    
    // Reset room selection when center changes
    if (formData.roomId) {
      setFormData(prev => ({
        ...prev,
        roomId: ''
      }));
    }
  };
  
  // New function to fetch rooms by center ID directly
  const fetchRoomsByCenter = async (centerId) => {
    try {
      console.log(`Finding rooms for center ID: ${centerId}`);
      setRoomsLoading(true);
      
      // Try the correct API endpoint first: /rooms/center/{centerId}
      try {
        const response = await axios.get(`${API_URL}/rooms/center/${centerId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log(`Successfully fetched rooms for center ${centerId} from API:`, response.data);
        
        if (response.data && response.data.length > 0) {
          setFormFilteredRooms(response.data);
          setError(null);
        } else {
          console.warn(`No rooms found for center ID ${centerId} from the API.`);
          setFormFilteredRooms([]);
          setError(`No rooms found for the selected center. You may need to create rooms for this center first.`);
        }
      } catch (apiError) {
        console.error(`Error fetching from direct endpoint for center ${centerId}:`, apiError);
        console.log("Falling back to local filtering method");
        
        // Fallback: Filter from existing rooms or fetch all and filter
        let roomsToFilter = rooms;
        if (rooms.length === 0) {
          try {
            const allRoomsResponse = await axios.get(`${API_URL}/rooms`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            roomsToFilter = allRoomsResponse.data;
            // Update the rooms state while we're at it
            setRooms(roomsToFilter);
          } catch (err) {
            console.error("Failed to fetch all rooms:", err);
            roomsToFilter = []; // Empty if we can't fetch
          }
        }
        
        // Filter the rooms based on centerId, handling type conversions
        const centerIdNum = parseInt(centerId, 10);
        const centerIdStr = centerId.toString();
        
        const filteredRooms = roomsToFilter.filter(room => {
          // Exit early if no room
          if (!room) return false;
          
          // Handle different ways centerId might be represented
          const roomCenterId = room.centerId;
          
          // Try multiple comparison methods
          return (
            // Direct comparison (number to number)
            roomCenterId === centerIdNum || 
            // String comparison
            roomCenterId?.toString() === centerIdStr ||
            // Object with id property
            (room.center?.id === centerIdNum) ||
            // String in center object
            (room.center?.id?.toString() === centerIdStr)
          );
        });
        
        console.log(`Filtered rooms for center ${centerId} via local method:`, filteredRooms);
        setFormFilteredRooms(filteredRooms);
        
        // If no rooms were found, show a warning but don't set an error since this is a fallback
        if (filteredRooms.length === 0) {
          console.warn(`No rooms found for center ID ${centerId} via local filtering.`);
          setError(`No rooms found for the selected center. Please create a room for this center first.`);
        } else {
          // Clear any previous error if we found rooms
          setError(null);
        }
      }
    } catch (err) {
      console.error(`Error in fetchRoomsByCenter for center ${centerId}:`, err);
      setError(`Failed to load rooms for the selected center. Please try again.`);
      setFormFilteredRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'DESKTOP',
      specifications: '',
      status: 'AVAILABLE',
      roomId: '',
      position: '',
      imageUrl: ''
    });
    setFormCenterId('');
    setFormFilteredRooms([]);
    setFormMode('create');
    setSelectedWorkstation(null);
    setIsEditModalOpen(false);
  };
  
  const handleEditWorkstation = (workstation) => {
    setSelectedWorkstation(workstation);
    
    // If workstation has a room, set center filter for form
    if (workstation.room) {
      const roomId = workstation.room.id;
      const centerId = workstation.room.centerId;
      
      // If we have the room's center ID directly from the API response
      if (centerId) {
        setFormCenterId(centerId.toString());
        // Filter rooms by this center ID
        setFormFilteredRooms(rooms.filter(r => r.centerId === centerId));
      } else {
        // Fall back to looking up the room in our local cache
        const room = rooms.find(r => r.id === roomId);
        if (room && room.centerId) {
          setFormCenterId(room.centerId.toString());
          setFormFilteredRooms(rooms.filter(r => r.centerId === room.centerId));
        }
      }
    }
    
    setFormData({
      name: workstation.name,
      description: workstation.description || '',
      type: workstation.type,
      specifications: workstation.specifications || '{}',
      status: workstation.status,
      roomId: workstation.room ? workstation.room.id : '',
      position: workstation.position || '',
      imageUrl: workstation.imageUrl || ''
    });
    setFormMode('edit');
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (workstation) => {
    setWorkstationToDelete(workstation);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setWorkstationToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setImageUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/workstations/upload-image`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update form data with the returned image URL
      setFormData(prev => ({
        ...prev,
        imageUrl: response.data.imageUrl
      }));

    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image: ' + (err.response?.data?.error || err.message));
    } finally {
      setImageUploading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const workstationData = { ...formData };
      
      // Add empty specifications object
      workstationData.specifications = '{}';
      
      if (formMode === 'create') {
        // Create new workstation
        await axios.post(`${API_URL}/workstations`, workstationData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // Update existing workstation
        await axios.put(`${API_URL}/workstations/${selectedWorkstation.id}`, workstationData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      // Refresh workstations
      fetchWorkstations();
      // Reset form
      resetForm();
      setError(null);
    } catch (err) {
      console.error('Error in workstation operation:', err);
      
      // Handle the specific room capacity error
      if (err.response?.status === 400 && err.response?.data?.error === 'Room capacity exceeded') {
        const errorData = err.response.data;
        setError(`Room capacity exceeded: ${errorData.roomName} has reached its maximum capacity of ${errorData.capacity} workstations.`);
      } else {
        setError(`Failed to ${formMode} workstation: ` + (err.response?.data?.message || err.message));
      }
    }
  };
  
  const handleDeleteWorkstation = async () => {
    if (!workstationToDelete) return;
    
    try {
      await axios.delete(`${API_URL}/workstations/${workstationToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Refresh workstations list
      fetchWorkstations();
      setError(null);
      handleCloseDeleteModal();
    } catch (err) {
      setError('Failed to delete workstation: ' + (err.response?.data?.message || err.message));
      console.error(err);
      handleCloseDeleteModal();
    }
  };
  
  // Filter workstations based on selected center and room
  const filteredWorkstations = workstations;
  
  // Helpers for display
  const getRoomName = (roomId) => {
    // Check if the roomId parameter is an object (which means we're getting the whole room object)
    if (roomId && typeof roomId === 'object') {
      return roomId.name || 'Unknown Room';
    }
    
    // Otherwise, find the room by ID
    const room = rooms.find(room => room.id === roomId);
    return room ? room.name : 'Unknown Room';
  };
  
  const getCenterForRoom = (roomId) => {
    // Check if the roomId parameter is an object (which means we're getting the whole room object)
    if (roomId && typeof roomId === 'object') {
      return roomId.centerName || 'Unknown Center';
    }
    
    // Otherwise, find the room and center by ID
    const room = rooms.find(room => room.id === roomId);
    if (!room || !room.centerId) return 'Unknown Center';
    
    const center = centers.find(center => center.id === room.centerId);
    return center ? center.name : 'Unknown Center';
  };
  return (
    <div className="container mx-auto p-4 pt-6 md:p-6 lg:p-12 xl:p-24">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workstations Management</h1>
        {!isCenterManager && (
          <ShimmerButton 
            onClick={() => setFormMode('create')}
            className="btn btn-primary relative overflow-hidden transition-all duration-300 hover:shadow-md"
          >
            Create New Workstation
          </ShimmerButton>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Workstation Form */}
      {formMode === 'create' && !isCenterManager && (
        <MagicCard className="mb-6 group bg-white dark:bg-dark-sidebar p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Create New Workstation
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Center</label>
                <select
                  value={formCenterId}
                  onChange={handleFormCenterChange}
                  className="form-select w-full"
                  required
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
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Room</label>
                <select
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleInputChange}
                  className="form-select w-full"
                  required
                  disabled={!formCenterId || roomsLoading}
                >
                  <option value="">
                    {roomsLoading 
                      ? 'Loading rooms...' 
                      : formCenterId 
                        ? 'Select a Room' 
                        : 'Select a Center first'}
                  </option>
                  {formFilteredRooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} ({room.workStationCount || 0}/{room.capacity || 0} workstations)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Workstation Name</label>
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
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select w-full"
                  required
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Position (Optional)</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  placeholder="e.g., Desk 1, Corner Desk, etc."
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input w-full h-24"
                  placeholder="Brief description of the workstation"
                ></textarea>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Specifications (Optional)</label>
                <textarea
                  name="specifications"
                  value={formData.specifications}
                  onChange={handleInputChange}
                  className="form-input w-full h-24"
                  placeholder="Hardware specifications, software available, etc."
                ></textarea>
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Workstation Image (Optional)</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="form-input w-full"
                    disabled={imageUploading}
                  />
                  {imageUploading && (
                    <div className="flex items-center text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Uploading...
                    </div>
                  )}
                </div>
                {formData.imageUrl && (
                  <div className="mt-2">
                    <img 
                      src={`http://localhost:8080${formData.imageUrl}`} 
                      alt="Workstation preview" 
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}
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
                Create Workstation
              </ShimmerButton>
            </div>
          </form>
        </MagicCard>
      )}
      
      {/* Workstations List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 dark:border-accent-yellow"></div>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Loading workstations...</p>
        </div>
      ) : (
        workstations.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-dark-sidebar">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Workstation
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Specifications
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
                {workstations.map(workstation => (
                  <tr key={workstation.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {workstation.imageUrl && (
                          <div className="flex-shrink-0 h-12 w-12">
                            <img 
                              src={`http://localhost:8080${workstation.imageUrl}`} 
                              alt={`${workstation.name} workstation`}
                              className="h-12 w-12 rounded-lg object-cover border border-gray-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div>
                      <div className="font-medium text-gray-900 dark:text-white">{workstation.name}</div>
                          {workstation.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{workstation.description}</div>
                          )}
                      {workstation.position && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">Position: {workstation.position}</div>
                      )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-700 dark:text-gray-300">{getRoomName(workstation.room)}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{getCenterForRoom(workstation.room)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        {workstation.specifications && workstation.specifications.trim() !== '' && workstation.specifications !== '{}' ? (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div className="truncate max-h-16 overflow-hidden">
                              {workstation.specifications.length > 100 
                                ? workstation.specifications.substring(0, 100) + '...' 
                                : workstation.specifications}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No specifications</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${workstation.status === 'AVAILABLE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          workstation.status === 'UNAVAILABLE' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}
                      >
                        {workstation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button 
                        onClick={() => handleEditWorkstation(workstation)}
                        className="relative overflow-hidden text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 px-3 py-1 rounded"
                      >
                        <span className="relative z-10">Edit</span>
                        <BorderBeam className="opacity-0 hover:opacity-100" />
                      </button>
                      {!isCenterManager && (
                        <button 
                          onClick={() => handleOpenDeleteModal(workstation)}
                          className="relative overflow-hidden text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 px-3 py-1 rounded"
                        >
                          <span className="relative z-10">Delete</span>
                          <BorderBeam className="opacity-0 hover:opacity-100" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No workstations found. Create your first workstation by clicking the button above.</p>
          </div>
        )
      )}
      
      {/* Edit Modal */}
      <BlurModal
        isOpen={isEditModalOpen}
        onClose={resetForm}
        title="Edit Workstation"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Center</label>
              <select
                value={formCenterId}
                onChange={handleFormCenterChange}
                className="form-select w-full"
                required
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
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Room</label>
              <select
                name="roomId"
                value={formData.roomId}
                onChange={handleInputChange}
                className="form-select w-full"
                required
                disabled={!formCenterId || roomsLoading}
              >
                <option value="">
                  {roomsLoading 
                    ? 'Loading rooms...' 
                    : formCenterId 
                      ? 'Select a Room' 
                      : 'Select a Center first'}
                </option>
                {formFilteredRooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.workStationCount || 0}/{room.capacity || 0} workstations)
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Workstation Name</label>
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
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-select w-full"
                required
              >
                <option value="AVAILABLE">Available</option>
                <option value="UNAVAILABLE">Unavailable</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Position (Optional)</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                className="form-input w-full"
                placeholder="e.g., Desk 1, Corner Desk, etc."
              />
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-input w-full h-24"
                placeholder="Brief description of the workstation"
              ></textarea>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Specifications (Optional)</label>
              <textarea
                name="specifications"
                value={formData.specifications}
                onChange={handleInputChange}
                className="form-input w-full h-24"
                placeholder="Hardware specifications, software available, etc."
              ></textarea>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Workstation Image (Optional)</label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="form-input w-full"
                  disabled={imageUploading}
                />
                {imageUploading && (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Uploading...
                  </div>
                )}
              </div>
              {formData.imageUrl && (
                                  <div className="mt-2">
                    <img 
                      src={`http://localhost:8080${formData.imageUrl}`} 
                      alt="Workstation preview" 
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
              )}
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
              Update Workstation
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
            Are you sure you want to delete workstation "{workstationToDelete?.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCloseDeleteModal}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <ShimmerButton
              onClick={handleDeleteWorkstation}
              className="btn btn-danger bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </ShimmerButton>
          </div>
        </div>
      </BlurModal>
    </div>
  );
};

export default WorkstationsManagement; 