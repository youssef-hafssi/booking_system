import React, { useState, useEffect } from 'react';
import { reservationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format, addDays, subDays, startOfDay } from 'date-fns';
import { BsChevronLeft, BsChevronRight, BsCalendar, BsClock } from 'react-icons/bs';

const TimeSlotCalendar = ({ workstationId, workstationName, onSlotSelect }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch time slots for the selected date and workstation
  useEffect(() => {
    if (!workstationId) {
      setTimeSlots([]);
      return;
    }

    const fetchTimeSlots = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching time slots for:', { workstationId, date: currentDate });
        console.log('CurrentDate details:', {
          currentDate: currentDate,
          toISOString: currentDate.toISOString(),
          toDateString: currentDate.toDateString(),
          formatted: currentDate.toISOString().split('T')[0]
        });
        
        const response = await reservationService.getTimeSlots(workstationId, currentDate);
        console.log('Time slots response:', response.data);
        setTimeSlots(response.data);
      } catch (err) {
        console.error('Error fetching time slots:', err);
        setError('Failed to load time slots. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSlots();
  }, [workstationId, currentDate]);

  // Navigation functions
  const goToPreviousDay = () => {
    const newDate = subDays(currentDate, 1);
    // Don't allow going to past dates
    if (newDate >= startOfDay(new Date())) {
      setCurrentDate(newDate);
    }
  };

  const goToNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle slot selection
  const handleSlotClick = (slot) => {
    if (slot.available && onSlotSelect) {
      onSlotSelect(slot, currentDate);
    }
  };

  // Check if current date is today
  const isToday = startOfDay(currentDate).getTime() === startOfDay(new Date()).getTime();
  const isPastDate = currentDate < startOfDay(new Date());

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BsCalendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Available Time Slots
          </h3>
        </div>
        
        {workstationName && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {workstationName}
          </div>
        )}
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <button
          onClick={goToPreviousDay}
          disabled={isPastDate || startOfDay(subDays(currentDate, 1)) < startOfDay(new Date())}
          className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <BsChevronLeft />
          <span>Previous</span>
        </button>

        <div className="flex items-center space-x-4">
          <h4 className="text-xl font-bold text-gray-900 dark:text-white">
            {format(currentDate, 'EEEE, MMMM do, yyyy')}
          </h4>
          
          {!isToday && (
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={goToNextDay}
          className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <span>Next</span>
          <BsChevronRight />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading time slots...</span>
        </div>
      )}

      {/* Time Slots Grid */}
      {!loading && !error && workstationId && (
        <div>
          {timeSlots.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <BsClock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No time slots available for this date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {timeSlots.map((slot) => (
                <button
                  key={`${slot.hour}-${slot.timeLabel}`}
                  onClick={() => handleSlotClick(slot)}
                  disabled={!slot.available}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 text-center
                    ${slot.available 
                      ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100 hover:border-green-300 cursor-pointer dark:bg-green-900/20 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30' 
                      : 'bg-red-50 border-red-200 text-red-800 cursor-not-allowed dark:bg-red-900/20 dark:border-red-700 dark:text-red-400'
                    }
                    ${slot.available ? 'hover:shadow-md' : 'opacity-75'}
                  `}
                >
                  <div className="font-bold text-lg mb-1">
                    {slot.timeLabel}
                  </div>
                  <div className="text-xs font-medium">
                    {slot.available ? 'Available' : 'Booked'}
                  </div>
                  {!slot.available && slot.reservedBy && slot.reservedBy !== 'Unavailable' && (
                    <div className="text-xs mt-1 truncate">
                      {slot.reservedBy}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Workstation Selected */}
      {!workstationId && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <BsCalendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Please select a workstation to view available time slots.</p>
        </div>
      )}

      {/* Legend */}
      {timeSlots.length > 0 && (
        <div className="mt-6 flex items-center justify-center space-x-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-200 rounded dark:bg-green-900/20 dark:border-green-700"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-200 rounded dark:bg-red-900/20 dark:border-red-700"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Booked</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotCalendar; 