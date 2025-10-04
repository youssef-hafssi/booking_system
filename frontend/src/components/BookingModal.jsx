import React, { useState } from 'react';
import { format, addHours } from 'date-fns';
import { reservationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BsX, BsClock, BsCalendar, BsLaptop } from 'react-icons/bs';
// Temporarily removed timezone import to fix build issue
// import { logTimezoneInfo, isUserTimezoneMatchingApp, APP_TIMEZONE } from '../utils/timezone';

const BookingModal = ({ isOpen, onClose, slot, date, workstation, onBookingSuccess }) => {
  const { user } = useAuth();
  const [duration, setDuration] = useState(1); // Duration in hours
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setDuration(1);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !slot || !date || !workstation) {
    return null;
  }

  // Calculate start and end times - avoid timezone conversion issues
  // Instead of using new Date() which converts timezones, we'll parse the time manually
  // to preserve the exact hour values from the backend
  const parseTimeWithoutTimezone = (isoString) => {
    // Extract the date and time parts from the ISO string
    const [datePart, timePart] = isoString.split('T');
    const [hourStr, minuteStr] = timePart.split(':');
    
    // Create a date object using the date and time without timezone conversion
    const [yearStr, monthStr, dayStr] = datePart.split('-');
    return new Date(
      parseInt(yearStr),
      parseInt(monthStr) - 1, // Month is 0-indexed
      parseInt(dayStr),
      parseInt(hourStr),
      parseInt(minuteStr),
      0 // seconds
    );
  };
  
  const startTime = parseTimeWithoutTimezone(slot.startTime);
  const endTime = addHours(startTime, duration);
  
  // Use the timeLabel from backend if available, otherwise format the time
  const getDisplayTime = (hours = 0) => {
    if (hours === 0 && slot.timeLabel) {
      // Convert backend's 24-hour format to 12-hour format for display
      const [hourStr] = slot.timeLabel.split(':');
      const hour24 = parseInt(hourStr);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12}:00 ${ampm}`;
    }
    // For end time or when timeLabel is not available, calculate display time
    const targetTime = addHours(startTime, hours);
    return format(targetTime, 'h:mm a');
  };
  
  // Debug logging for timezone consistency
  console.log('Slot timeLabel:', slot.timeLabel);
  console.log('Slot startTime (from backend):', slot.startTime);
  console.log('Parsed startTime (local):', startTime.toString());
  
  // Log timezone information for debugging
  console.log('=== Timezone Information ===');
  console.log('App Timezone: Africa/Casablanca');
  console.log('User Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Warn if user timezone doesn't match app timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (userTimezone !== 'Africa/Casablanca') {
    console.warn(`⚠️ Timezone mismatch: User is in ${userTimezone} but app uses Africa/Casablanca`);
  }
  
  const startTimeDisplay = getDisplayTime(0);
  const endTimeDisplay = getDisplayTime(duration);

  // Generate duration options based on user role (students max 2 hours, others max 4 hours)
  const maxDuration = user?.role === 'STUDENT' ? 2 : 4;
  const durationOptions = Array.from({length: maxDuration}, (_, i) => i + 1).map(hours => {
    const endTime = addHours(startTime, hours);
    const endTimeDisplay = getDisplayTime(hours);
    return {
      value: hours,
      label: `${hours} hour${hours > 1 ? 's' : ''}`,
      endTime: endTime,
      endTimeDisplay: endTimeDisplay
    };
  });

  const handleBooking = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate that user is logged in
      if (!user?.id) {
        setError('You must be logged in to make a reservation.');
        setLoading(false);
        return;
      }

      // Validate duration for student users
      if (user.role === 'STUDENT' && duration > 2) {
        setError('Students can only book up to 2 hours per reservation.');
        setLoading(false);
        return;
      }

      // Validate that the booking is not in the past
      const now = new Date();
      const selectedTime = new Date(slot.startTime);
      
      console.log('Current time:', now.toISOString());
      console.log('Selected slot time:', selectedTime.toISOString());
      console.log('Slot startTime raw:', slot.startTime);
      console.log('Selected time > now?', selectedTime > now);
      
      // Check if the selected time is in the past (with a small buffer for processing time)
      const minimumBookingTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now
      if (selectedTime < minimumBookingTime) {
        setError(`Cannot book time slots in the past. Please select a future time slot.`);
        setLoading(false);
        return;
      }

      // Format times for backend - preserve exact times without timezone conversion
      const formatTimeForBackend = (date) => {
        // Create a date string in YYYY-MM-DDTHH:mm:ss format
        // Use the exact local time values to avoid any timezone shifts
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };

      const reservationData = {
        userId: user.id,
        workStationId: workstation.id,
        startTime: formatTimeForBackend(startTime),
        endTime: formatTimeForBackend(endTime),
      };

      console.log('=== RESERVATION CREATION DEBUG ===');
      console.log('Selected slot timeLabel:', slot.timeLabel);
      console.log('Selected slot startTime:', slot.startTime);
      console.log('Parsed startTime (no timezone conversion):', startTime.toString());
      console.log('Calculated endTime:', endTime.toString());
      console.log('Duration (hours):', duration);
      console.log('Sending to backend:', reservationData);
      console.log('Expected reservation: ', slot.timeLabel, 'to', format(endTime, 'HH:mm'));
      console.log('===================================');
      const response = await reservationService.createReservation(reservationData);
      
      console.log('Reservation created successfully:', response.data);
      
      // Notify parent component of successful booking
      if (onBookingSuccess) {
        onBookingSuccess(response.data);
      }
      
      onClose();
    } catch (err) {
      console.error('Error creating reservation:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
      console.error('Error response headers:', err.response?.headers);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to create reservation. Please try again.';
      
      if (err.response?.data) {
        // Handle validation errors (usually an object with field errors)
        if (typeof err.response.data === 'object' && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (typeof err.response.data === 'object' && err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.fieldErrors) {
          // Handle field validation errors
          const fieldErrors = Object.entries(err.response.data.fieldErrors)
            .map(([field, error]) => `${field}: ${error}`)
            .join(', ');
          errorMessage = `Validation error: ${fieldErrors}`;
        } else {
          errorMessage = JSON.stringify(err.response.data);
        }
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid reservation data. Please check your selection and try again.';
      } else if (err.response?.status === 401) {
        errorMessage = 'You must be logged in to make a reservation.';
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to make this reservation.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Book Time Slot
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <BsX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Booking Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3">
              <BsLaptop className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {workstation.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {workstation.room?.name} - {workstation.room?.center?.name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <BsCalendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {format(date, 'EEEE, MMMM do, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <BsClock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {startTimeDisplay} - {endTimeDisplay}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {duration} hour{duration > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Duration
            </label>
            {user?.role === 'STUDENT' && (
              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  ℹ️ Students can book up to 2 hours per reservation
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDuration(option.value)}
                  className={`
                    p-3 rounded-lg border-2 text-center transition-all duration-200
                    ${duration === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500'
                    }
                  `}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Until {option.endTimeDisplay}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBooking}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Booking...
                </>
              ) : (
                'Book Now'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal; 