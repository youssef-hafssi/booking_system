import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { reservationService, workstationService, centerService } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { BsCalendarCheck, BsCalendarX, BsClock, BsLaptop } from 'react-icons/bs';
import { cn } from '../../../utils/cn';

// Reservation card component
const ReservationCard = ({ reservation, onCancel, onDelete }) => {
  const canCancel = reservation.status !== 'CANCELLED' && isAfter(parseISO(reservation.endTime), new Date());
  const canEdit = reservation.status === 'PENDING' && isAfter(parseISO(reservation.endTime), new Date());
  const canDelete = isBefore(parseISO(reservation.endTime), new Date()) || reservation.status === 'CANCELLED';
  const [centerName, setCenterName] = useState('Unknown Center');
  const [roomName, setRoomName] = useState('Unknown Room');
  const [isEditing, setIsEditing] = useState(false);
  const [editedStartTime, setEditedStartTime] = useState(() => {
    // Convert the ISO string to local time for datetime-local input
    const date = parseISO(reservation.startTime);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  });
  const [editedEndTime, setEditedEndTime] = useState(() => {
    // Convert the ISO string to local time for datetime-local input
    const date = parseISO(reservation.endTime);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  });
  const [editedNotes, setEditedNotes] = useState(reservation.notes || '');
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [canActuallyCancel, setCanActuallyCancel] = useState(true);
  const [cancellationMessage, setCancellationMessage] = useState('');
  
  // Enhanced function to fetch and handle center info
  useEffect(() => {
    console.log("Reservation data in card:", reservation);
    
    // Set room name if available
    if (reservation.workStation?.room?.name) {
      setRoomName(reservation.workStation.room.name);
    } else if (reservation.workStation?.roomName) {
      setRoomName(reservation.workStation.roomName);
    }
    
    // Check center data sources in all possible locations
    if (reservation.workStation?.room?.center?.name) {
      // Direct center object
      setCenterName(reservation.workStation.room.center.name);
    } else if (reservation.workStation?.room?.centerName) {
      // Center name directly on room
      setCenterName(reservation.workStation.room.centerName);
    } else if (reservation.workStation?.centerName) {
      // Center name directly on workstation
      setCenterName(reservation.workStation.centerName);
    } else if (reservation.workStation?.room?.centerId) {
      // Fetch center by ID
      const fetchCenterInfo = async () => {
        try {
          console.log("Fetching center with ID:", reservation.workStation.room.centerId);
          const response = await centerService.getCenterById(reservation.workStation.room.centerId);
          console.log("Center data response:", response);
          if (response.data && response.data.name) {
            setCenterName(response.data.name);
          }
        } catch (error) {
          console.error("Error fetching center info for reservation:", error);
        }
      };
      
      fetchCenterInfo();
    }
  }, [reservation]);
  
  // Check if user can actually cancel this reservation (student time restriction)
  useEffect(() => {
    if (canCancel && reservation.status !== 'CANCELLED') {
      reservationService.canCancelReservation(reservation.id)
        .then(response => {
          setCanActuallyCancel(response.data.canCancel);
          setCancellationMessage(response.data.message);
        })
        .catch(error => {
          console.error('Error checking cancellation eligibility:', error);
          setCanActuallyCancel(false);
          setCancellationMessage('Cannot check cancellation eligibility');
        });
    }
  }, [reservation.id, canCancel, reservation.status]);
  
  const handleEdit = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to edit reservations');
        window.location.href = '/login';
        return;
      }

      // Format the dates to match backend expectations (LocalDateTime format)
      const formatDate = (dateString) => {
        // Parse the local datetime string and format it to match backend's LocalDateTime
        const date = parseISO(dateString);
        return format(date, "yyyy-MM-dd'T'HH:mm:ss");
      };

      const updatedReservation = {
        userId: reservation.user.id,
        workStationId: reservation.workStation.id,
        startTime: formatDate(editedStartTime),
        endTime: formatDate(editedEndTime),
        notes: editedNotes || null,
        status: reservation.status
      };

      console.log('Sending update with data:', updatedReservation);

      const response = await reservationService.updateReservation(reservation.id, updatedReservation);
      console.log('Update successful:', response);
      setIsEditing(false);
      // Refresh the reservations list
      window.location.reload();
    } catch (error) {
      console.log('Update error:', error.response?.data || error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        setError(error.response?.data?.message || 'Failed to update reservation');
      }
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const confirmed = window.confirm('Are you sure you want to delete this reservation? This action cannot be undone.');
      if (!confirmed) {
        setIsDeleting(false);
        return;
      }

      await reservationService.deleteReservation(reservation.id);
      if (onDelete) {
        onDelete(reservation.id);
      }
      // Refresh the page after successful deletion
      window.location.reload();
    } catch (error) {
      console.error('Delete error:', error.response?.data || error);
      setError(error.response?.data?.message || 'Failed to delete reservation');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isEditing) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-4"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={editedStartTime}
              onChange={(e) => setEditedStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Time
            </label>
            <input
              type="datetime-local"
              value={editedEndTime}
              onChange={(e) => setEditedEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg"
              rows={3}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleEdit}
              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      <div className="p-5">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {reservation.workStation?.name || 'Unknown Workstation'}
          </h3>
          <span className={cn(
            "px-2 py-1 text-xs font-medium rounded-full",
            reservation.status === 'CONFIRMED' 
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
              : reservation.status === 'PENDING'
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {reservation.status}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <BsLaptop className="mr-2 text-gray-500 dark:text-gray-400" />
            <span>
              {centerName} / {roomName}
            </span>
          </div>

          <div className="flex items-center">
            <BsCalendarCheck className="mr-2 text-gray-500 dark:text-gray-400" />
            <span>
              {format(parseISO(reservation.startTime), 'MMM d, yyyy')} at {format(parseISO(reservation.startTime), 'h:mm a')}
            </span>
          </div>

          <div className="flex items-center">
            <BsClock className="mr-2 text-gray-500 dark:text-gray-400" />
            <span>
              {format(parseISO(reservation.endTime), 'h:mm a')}
            </span>
          </div>
        
          {reservation.notes && (
            <div className="flex items-center">
              <BsClock className="mr-2 text-gray-500 dark:text-gray-400" />
              <span>{reservation.notes}</span>
          </div>
          )}
          
          {/* Cancellation Details - only show if reservation was cancelled and has cancellation info */}
          {reservation.status === 'CANCELLED' && reservation.cancellationReason && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <BsCalendarX className="mr-2 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    Cancellation Reason:
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {reservation.cancellationReason}
                  </p>
                  {reservation.cancelledBy && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Cancelled by {reservation.cancelledBy.firstName} {reservation.cancelledBy.lastName}
                      {reservation.cancelledAt && (
                        <span> on {format(parseISO(reservation.cancelledAt), 'MMM d, yyyy h:mm a')}</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          {canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-sm transition-colors duration-300"
            >
              Edit Reservation
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => canActuallyCancel ? onCancel(reservation.id) : null}
              disabled={!canActuallyCancel}
              title={!canActuallyCancel ? cancellationMessage : 'Cancel this reservation'}
              className={cn(
                "px-3 py-1 border rounded-lg text-sm transition-colors duration-300",
                canActuallyCancel
                  ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 cursor-pointer"
                  : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
              )}
            >
              {canActuallyCancel ? 'Cancel Reservation' : 'Cannot Cancel'}
            </button>
          )}
          {!canActuallyCancel && cancellationMessage && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {cancellationMessage}
            </div>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn(
                "px-3 py-1 rounded-lg text-sm transition-colors duration-300",
                isDeleting
                  ? "bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
                  : "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
              )}
            >
              {isDeleting ? 'Deleting...' : 'Delete Reservation'}
            </button>
          )}
          </div>
      </div>
    </div>
  );
};

// Reservation form component
const ReservationForm = ({ selectedWorkstation, onReservationCreated, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Initialize with dates 1 hour in the future or use preselected times
  const initialStartTime = () => {
    if (selectedWorkstation?.preselectedStartTime) {
      return selectedWorkstation.preselectedStartTime;
    }
    const startDate = new Date();
    // Add 1 hour to current time to ensure it's in the future
    startDate.setHours(startDate.getHours() + 1);
    return format(startDate, "yyyy-MM-dd'T'HH:mm");
  };
  
  const initialEndTime = () => {
    if (selectedWorkstation?.preselectedEndTime) {
      return selectedWorkstation.preselectedEndTime;
    }
    const endDate = new Date();
    // Add 2 hours to current time
    endDate.setHours(endDate.getHours() + 2);
    return format(endDate, "yyyy-MM-dd'T'HH:mm");
  };
  
  const [startTime, setStartTime] = useState(initialStartTime());
  const [endTime, setEndTime] = useState(initialEndTime());
  const [notes, setNotes] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [centerName, setCenterName] = useState('Unknown Center');
  const [validationMessage, setValidationMessage] = useState('');
  const [durationValid, setDurationValid] = useState(true);
  const [cooldownValid, setCooldownValid] = useState(true);
  
  // Fetch center information if missing
  useEffect(() => {
    const fetchCenterInfo = async () => {
      if (!selectedWorkstation) return;
      
      // If center data is missing but we have room data with center ID
      if (selectedWorkstation.room && !selectedWorkstation.room.center && selectedWorkstation.room.centerId) {
        try {
          const response = await centerService.getCenterById(selectedWorkstation.room.centerId);
          if (response.data && response.data.name) {
            console.log("Retrieved center info separately:", response.data);
            setCenterName(response.data.name);
          }
        } catch (error) {
          console.error("Error fetching center details:", error);
        }
      } else if (selectedWorkstation.room?.center?.name) {
        // If center data is available
        setCenterName(selectedWorkstation.room.center.name);
      }
    };
    
    fetchCenterInfo();
  }, [selectedWorkstation]);
  
  // Auto-adjust end time for students when start time changes (2-hour limit)
  useEffect(() => {
    if (user?.role === 'STUDENT' && startTime) {
      const startDate = new Date(startTime);
      if (!isNaN(startDate.getTime())) {
        const maxEndDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours
        const maxEndTime = format(maxEndDate, "yyyy-MM-dd'T'HH:mm");
        
        // If current end time is beyond 2 hours, adjust it
        if (endTime) {
          const currentEndDate = new Date(endTime);
          if (!isNaN(currentEndDate.getTime()) && currentEndDate > maxEndDate) {
            setEndTime(maxEndTime);
          }
        }
      }
    }
  }, [startTime, user?.role, endTime]);
  
  // Check availability when start/end time changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedWorkstation) return;
      
      setValidationMessage('');
      setDurationValid(true);
      setCooldownValid(true);
      
      try {
        // Validate non-empty dates
        if (!startTime || !endTime) {
          setIsAvailable(false);
          return;
        }
        
        // Create JavaScript Date objects for validation
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        
        // Skip availability check if dates are invalid
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          setIsAvailable(false);
          return;
        }
        
        // Skip availability check if start time is not before end time
        if (startDate >= endDate) {
          setIsAvailable(false);
          setValidationMessage('End time must be after start time');
          return;
        }
        
        // Ensure the start date is in the future to match backend validation
        const now = new Date();
        if (startDate <= now) {
          setIsAvailable(false);
          setValidationMessage('Start time must be in the future');
          return;
        }
        
        // Check duration validation (2 hours max for students)
        try {
          const durationResponse = await reservationService.validateReservationDuration(startDate, endDate);
          if (!durationResponse.data.isValid) {
            setDurationValid(false);
            setValidationMessage(durationResponse.data.message);
            setIsAvailable(false);
            return;
          }
        } catch (durationError) {
          console.error("Error validating duration:", durationError);
          setDurationValid(false);
          setValidationMessage('Unable to validate duration');
          setIsAvailable(false);
          return;
        }
        
        // Check cooldown period
        try {
          const cooldownResponse = await reservationService.canMakeReservation(startDate);
          if (!cooldownResponse.data.canReserve) {
            setCooldownValid(false);
            setValidationMessage(cooldownResponse.data.message);
            setIsAvailable(false);
            return;
          }
        } catch (cooldownError) {
          console.error("Error checking cooldown:", cooldownError);
          setCooldownValid(false);
          setValidationMessage('Unable to validate timing');
          setIsAvailable(false);
          return;
        }

        // Use the same date formatting approach as in handleSubmit
        const formatLocalDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          
          return `${year}-${month}-${day}T${hours}:${minutes}:00`;
        };
        
        const formattedStartTime = formatLocalDate(startDate);
        const formattedEndTime = formatLocalDate(endDate);
        
        console.log("Checking availability with dates:", { formattedStartTime, formattedEndTime });
        
        const response = await reservationService.checkAvailability(
          selectedWorkstation.id,
          formattedStartTime,
          formattedEndTime
        );
        setIsAvailable(response.data);
      } catch (error) {
        console.error("Error checking availability:", error);
        setIsAvailable(false);
      }
    };
    
    checkAvailability();
  }, [selectedWorkstation, startTime, endTime]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAvailable) {
      setError("This workstation is not available for the selected time period.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Parse dates directly from the form values (yyyy-MM-dd'T'HH:mm format)
      // This should maintain timezone consistency for the backend
      
      // Validate non-empty dates
      if (!startTime || !endTime) {
        throw new Error("Start and end times are required");
      }
      
      // Create JavaScript Date objects just for validation purposes
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date format");
      }
      
      // Check if start time is before end time
      if (startDate >= endDate) {
        setError("Start time must be before end time");
        return;
      }
      
      // Ensure the date we send is in the future
      const now = new Date();
      if (startDate <= now) {
        // If the selected date is in the past, set error
        setError("Start time must be in the future. Please select a future date and time.");
        return;
      }
      
      // Validate duration (students limited to 2 hours)
      try {
        const durationResponse = await reservationService.validateReservationDuration(startDate, endDate);
        if (!durationResponse.data.isValid) {
          setError(durationResponse.data.message);
          return;
        }
      } catch (durationError) {
        console.error("Error validating duration:", durationError);
        setError("Failed to validate reservation duration. Please try again.");
        return;
      }
      
      // Check if student can make a new reservation (cooldown period)
      try {
        const cooldownResponse = await reservationService.canMakeReservation(startDate);
        if (!cooldownResponse.data.canReserve) {
          setError(cooldownResponse.data.message);
          return;
        }
      } catch (cooldownError) {
        console.error("Error checking cooldown period:", cooldownError);
        setError("Failed to validate reservation timing. Please try again.");
        return;
      }
      
      // Get date parts in the local timezone (preserving the user's selection)
      // This approach avoids timezone conversion issues
      const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        // Format without timezone information
        return `${year}-${month}-${day}T${hours}:${minutes}:00`;
      };
      
      const formattedStartTime = formatLocalDate(startDate);
      const formattedEndTime = formatLocalDate(endDate);
      
      console.log("Input datetime values:", { startTime, endTime });
      console.log("Formatted dates for backend:", { formattedStartTime, formattedEndTime });
      console.log("Current time:", now.toISOString());

      const reservationData = {
        userId: user.id,
        workStationId: selectedWorkstation.id,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        notes,
        status: 'PENDING'
      };
      
      console.log("Sending reservation data:", JSON.stringify(reservationData, null, 2));
      
      const response = await reservationService.createReservation(reservationData);
      console.log("Reservation response:", response);
      onReservationCreated(response.data);
    } catch (error) {
      console.error("Error creating reservation:", error);
      console.error("Error response:", error.response);
      
      // Enhanced error reporting
      if (error.response?.data) {
        console.error("Error response data:", error.response.data);
        
        // Display detailed validation errors if available
        if (error.response.data.errors) {
          console.error("Validation errors:", error.response.data.errors);
          
          // Extract all validation error messages
          const errorMessages = [];
          const errors = error.response.data.errors;
          
          for (const field in errors) {
            if (errors[field]) {
              if (typeof errors[field] === 'string') {
                errorMessages.push(`${field}: ${errors[field]}`);
              } else if (Array.isArray(errors[field])) {
                errors[field].forEach(err => errorMessages.push(`${field}: ${err}`));
              }
            }
          }
          
          if (errorMessages.length > 0) {
            setError(`Validation errors: ${errorMessages.join(', ')}`);
            return;
          }
        }
      }
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("An error occurred while creating the reservation.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">New Reservation</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          &times;
        </button>
      </div>
      
      {selectedWorkstation ? (
        <div className="mb-6 p-4 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg border border-brand-primary/20 dark:border-brand-primary/30">
          <h3 className="text-md font-medium text-brand-primary dark:text-brand-light mb-2">
            {selectedWorkstation.name}
          </h3>
          <div className="text-sm text-brand-primary/80 dark:text-brand-light/80">
            <p>Center: {centerName}</p>
            <p>Room: {selectedWorkstation.room?.name || 'Unknown Room'}</p>
          </div>
        </div>
      ) : null}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Notice for preselected times */}
          {selectedWorkstation?.preselectedStartTime && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg border border-green-100 dark:border-green-900/30 text-sm">
              ✓ Time slot selected from calendar. You can adjust the times if needed.
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={3}
              placeholder="Add any additional information about your reservation"
            />
          </div>
          
          {!isAvailable && validationMessage ? (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30 text-sm">
              {validationMessage}
            </div>
          ) : !isAvailable ? (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30 text-sm">
              This workstation is not available for the selected time period.
            </div>
          ) : null}
          
          {error ? (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30 text-sm">
              {error}
            </div>
          ) : null}
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !isAvailable}
              className={cn(
                "px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors duration-300",
                isAvailable 
                  ? "bg-brand-primary hover:bg-brand-hover" 
                  : "bg-gray-400 cursor-not-allowed"
              )}
            >
              {loading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                  Creating...
                </span>
              ) : (
                "Create Reservation"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const WorkstationReservations = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [selectedWorkstation, setSelectedWorkstation] = useState(null);
  const [hasActiveReservation, setHasActiveReservation] = useState(false);
  const [activeReservationMessage, setActiveReservationMessage] = useState('');
  
  // Parse workstation ID from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const workstationId = params.get('workstation');
    
    if (workstationId) {
      const fetchWorkstation = async () => {
        try {
          console.log(`Fetching workstation with ID: ${workstationId}`);
          const response = await workstationService.getWorkstationById(workstationId);
          console.log("Workstation response:", response);
          console.log("Workstation data structure:", JSON.stringify(response.data, null, 2));
          
          let workstationData = response.data;
          
          // Check if room data exists
          if (!workstationData.room) {
            console.error("Workstation has no room data");
          } else {
            // Create a normalized center object if it doesn't exist but we have center IDs/names
            if (!workstationData.room.center && (workstationData.room.centerId || workstationData.room.centerName)) {
              console.log("Creating normalized center object from available data");
              
              // Create a basic center object from the available data in room
              const normalizedCenter = {
                id: workstationData.room.centerId || null,
                name: workstationData.room.centerName || "Unknown Center"
              };
              
              // Add the center object to the room
              workstationData.room.center = normalizedCenter;
              console.log("Added normalized center object:", normalizedCenter);
            }
            
            // If we still don't have center data but have a centerId, try to fetch it
            if (!workstationData.room.center && workstationData.room.centerId) {
              try {
                console.log("Attempting to fetch center data for centerId:", workstationData.room.centerId);
                const centerResponse = await centerService.getCenterById(workstationData.room.centerId);
                
                if (centerResponse.data) {
                  // Create an enriched workstation object with the center data
                  workstationData = {
                    ...workstationData,
                    room: {
                      ...workstationData.room,
                      center: centerResponse.data
                    }
                  };
                  console.log("Successfully enriched workstation with center data");
                }
              } catch (centerError) {
                console.error("Failed to fetch center data:", centerError);
                
                // Create a fallback center object if fetch fails
                workstationData.room.center = {
                  id: workstationData.room.centerId,
                  name: workstationData.room.centerName || "Unknown Center"
                };
              }
            }
          }
          
          setSelectedWorkstation(workstationData);
          setShowReservationForm(true);
        } catch (error) {
          console.error("Error fetching workstation:", error);
        }
      };
      
      fetchWorkstation();
    }
  }, [location.search]);
  
  // Fetch user's reservations
  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        if (user) {
          const response = await reservationService.getUserReservations(user.id);
          console.log("Raw reservations from API:", response.data);
          
          // Enrich reservations with center and room data if missing
          const enrichedReservations = await Promise.all(
            response.data.map(async (reservation) => {
              // Skip if we already have complete center and room data
              if (reservation.workStation?.room?.center?.name && 
                 reservation.workStation?.room?.name) {
                return reservation;
              }
              
              let enriched = {...reservation};
              
              // If workstation has room with centerId but no center data
              if (enriched.workStation?.room?.centerId && 
                 (!enriched.workStation.room.center || !enriched.workStation.room.center.name)) {
                try {
                  const centerResponse = await centerService.getCenterById(
                    enriched.workStation.room.centerId);
                  
                  if (centerResponse.data) {
                    // Add center data to the reservation
                    enriched = {
                      ...enriched,
                      workStation: {
                        ...enriched.workStation,
                        room: {
                          ...enriched.workStation.room,
                          center: centerResponse.data,
                          centerName: centerResponse.data.name
                        }
                      }
                    };
                  }
                } catch (error) {
                  console.error(`Error fetching center data for reservation ${reservation.id}:`, error);
                }
              }
              
              return enriched;
            })
          );
          
          console.log("Enriched reservations:", enrichedReservations);
          setReservations(enrichedReservations);
        }
      } catch (error) {
        console.error("Error fetching reservations:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReservations();
  }, [user]);
  
  // Check for active reservations on component mount
  useEffect(() => {
    const checkActiveReservations = async () => {
      if (!user || user.role !== 'STUDENT') return;
      
      try {
        const response = await reservationService.hasActiveReservations();
        setHasActiveReservation(response.data.hasActive);
        setActiveReservationMessage(response.data.message);
      } catch (error) {
        console.error('Error checking active reservations:', error);
      }
    };
    
    checkActiveReservations();
  }, [user, reservations]); // Re-check when reservations change
  
  // Handle reservation cancellation
  const handleCancelReservation = async (reservationId) => {
    try {
      await reservationService.cancelReservation(reservationId);
      
      // Update local state
      setReservations(prevReservations => 
        prevReservations.map(reservation => 
          reservation.id === reservationId 
            ? { ...reservation, status: 'CANCELLED' } 
            : reservation
        )
      );
    } catch (error) {
      console.error("Error canceling reservation:", error);
    }
  };
  
  // Handle new reservation created
  const handleReservationCreated = (newReservation) => {
    setReservations(prev => [newReservation, ...prev]);
    setShowReservationForm(false);
    setSelectedWorkstation(null);
    
    // Clear the workstation query parameter
    navigate('/dashboard/reservations', { replace: true });
  };
  
  // Group reservations by status
  const upcomingReservations = reservations.filter(
    r => r.status !== 'CANCELLED' && isAfter(parseISO(r.endTime), new Date())
  );
  
  const pastReservations = reservations.filter(
    r => !isAfter(parseISO(r.endTime), new Date()) || r.status === 'CANCELLED'
  );

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">My Reservations</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your workstation reservations</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              setShowReservationForm(!showReservationForm);
              if (showReservationForm) {
                setSelectedWorkstation(null);
                // Clear the workstation query parameter
                navigate('/dashboard/reservations', { replace: true });
              }
            }}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white rounded-lg text-sm font-medium transition-colors duration-300"
          >
            {showReservationForm ? "Cancel" : "Find Workstation"}
          </button>
        </div>
      </div>
      
      {showReservationForm ? (
        selectedWorkstation ? (
          // Check if student has active reservation
          user?.role === 'STUDENT' && hasActiveReservation ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center mb-6">
              <BsCalendarX className="mx-auto text-4xl text-yellow-500 mb-3" />
              <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-400 mb-2">
                Active Reservation Limit Reached
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                {activeReservationMessage}
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowReservationForm(false);
                    setSelectedWorkstation(null);
                    navigate('/dashboard/reservations', { replace: true });
                  }}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors duration-300"
                >
                  View My Reservations
                </button>
              </div>
            </div>
          ) : (
            <ReservationForm
              selectedWorkstation={selectedWorkstation}
              onReservationCreated={handleReservationCreated}
              onCancel={() => {
                setShowReservationForm(false);
                setSelectedWorkstation(null);
                // Clear the workstation query parameter
                navigate('/dashboard/reservations', { replace: true });
              }}
            />
          )
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center border border-gray-200 dark:border-gray-700 mb-6">
            <BsLaptop className="mx-auto text-4xl text-gray-400 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              No workstation selected
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please select a workstation to create a reservation
            </p>
            <button
              onClick={() => navigate('/dashboard/workstations')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-300"
            >
              Browse Workstations
            </button>
          </div>
        )
      ) : null}
      
      {loading ? (
        <div className="flex items-center justify-center p-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center border border-gray-200 dark:border-gray-700">
          <BsCalendarX className="mx-auto text-4xl text-gray-400 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No reservations found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have any workstation reservations yet
          </p>
          <button
            onClick={() => navigate('/dashboard/workstations')}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white rounded-lg text-sm font-medium transition-colors duration-300"
          >
            Find a Workstation
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Information banner for students */}
          {user?.role === 'STUDENT' && (
          <div className="bg-brand-primary/10 dark:bg-brand-primary/20 border border-brand-primary/20 dark:border-brand-primary/30 rounded-lg p-4">
            <h3 className="text-sm font-medium text-brand-primary dark:text-brand-light mb-2">
              📋 Reservation Rules for Students
            </h3>
            <ul className="text-sm text-brand-primary/80 dark:text-brand-light/80 space-y-1">
                <li>• Only one active reservation allowed at a time</li>
                <li>• Reservations are automatically confirmed</li>
                <li>• Maximum duration: 2 hours per reservation</li>
                <li>• Cannot cancel within 1 hour of start time</li>
                <li>• Must wait 1 hour after a reservation ends before making a new one</li>
              </ul>
            </div>
          )}
          
          {upcomingReservations.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Upcoming Reservations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingReservations.map(reservation => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    onCancel={handleCancelReservation}
                    onDelete={handleReservationCreated}
                  />
                ))}
              </div>
            </div>
          ) : null}
          
          {pastReservations.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Past Reservations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastReservations.map(reservation => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    onCancel={handleCancelReservation}
                    onDelete={handleReservationCreated}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default WorkstationReservations; 