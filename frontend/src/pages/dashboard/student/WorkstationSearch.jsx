import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { workstationService, centerService } from '../../../services/api';
import TimeSlotCalendar from '../../../components/TimeSlotCalendar';
import BookingModal from '../../../components/BookingModal';
import RecommendationModal from '../../../components/ai/RecommendationModal';

const WorkstationSearch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userCenter, setUserCenter] = useState(null);
  const [workstations, setWorkstations] = useState([]);
  const [selectedWorkstation, setSelectedWorkstation] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [bookingModal, setBookingModal] = useState({
    isOpen: false,
    slot: null,
    date: null
  });
  const [recommendationModal, setRecommendationModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState({
    center: true,
    workstations: false
  });
  const [error, setError] = useState({
    center: null,
    workstations: null
  });

  // Fetch user's assigned center and workstations on component mount
  useEffect(() => {
    const fetchUserCenterAndWorkstations = async () => {
      try {
        setLoading(prev => ({ ...prev, center: true, workstations: true }));
        setError({ center: null, workstations: null });

        // Check if user has an assigned center
        if (!user?.centerId) {
          setError(prev => ({ 
            ...prev, 
            center: 'You are not assigned to any center. Please contact an administrator.' 
          }));
          return;
        }

        // Fetch user's center details
        const centerResponse = await centerService.getCenterById(user.centerId);
        setUserCenter(centerResponse.data);

        // Fetch workstations for the user's center
        const workstationsResponse = await workstationService.getWorkstationsByCenter(user.centerId);
        setWorkstations(workstationsResponse.data);

      } catch (err) {
        console.error('Error fetching user center and workstations:', err);
        if (err.response?.status === 404) {
          setError(prev => ({ 
            ...prev, 
            center: 'Your assigned center was not found. Please contact an administrator.' 
          }));
        } else {
          setError(prev => ({ 
            ...prev, 
            workstations: 'Failed to load workstations. Please try again.' 
          }));
        }
      } finally {
        setLoading({ center: false, workstations: false });
      }
    };

    if (user) {
      fetchUserCenterAndWorkstations();
    }
  }, [user]);

  // Handle workstation selection
  const handleWorkstationSelect = (workstation) => {
    setSelectedWorkstation(workstation);
    setShowCalendar(true);
    setSuccessMessage(''); // Clear any previous success messages
  };

  // Handle time slot selection
  const handleSlotSelect = (slot, date) => {
    setBookingModal({
      isOpen: true,
      slot,
      date
    });
  };

  // Handle successful booking
  const handleBookingSuccess = (reservation) => {
    setBookingModal({ isOpen: false, slot: null, date: null });
    setSuccessMessage(`Reservation created successfully! Your workstation is booked for ${reservation.startTime}.`);
    
    // Optionally navigate to reservations page
    setTimeout(() => {
      navigate('/dashboard/reservations');
    }, 2000);
  };

  // Handle booking modal close
  const handleBookingModalClose = () => {
    setBookingModal({ isOpen: false, slot: null, date: null });
  };

  // Handle AI recommendation selection
  const handleRecommendationSelect = (bookingData) => {
    setSelectedWorkstation(bookingData.workstation);
    setBookingModal({
      isOpen: true,
      slot: bookingData.slot,
      date: bookingData.date,
      duration: bookingData.duration
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Find & Book Workstations
            </h2>
            {userCenter ? (
              <p className="text-gray-600 dark:text-gray-400">
                Select a workstation from <span className="font-semibold">{userCenter.name}</span> to view available time slots for booking.
              </p>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Loading your assigned center...
              </p>
            )}
          </div>
          
          {userCenter && (
            <button
              onClick={() => setRecommendationModal(true)}
              className="bg-gradient-to-r from-brand-primary to-brand-light text-white px-6 py-3 rounded-lg font-medium hover:from-brand-hover hover:to-brand-primary transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Suggérer pour moi
            </button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-600 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Center Assignment Error */}
      {error.center && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
            Center Assignment Required
          </h3>
          <p className="text-red-600 dark:text-red-400">{error.center}</p>
        </div>
      )}

      {/* User Center Info */}
      {userCenter && !error.center && (
        <div className="bg-brand-primary/10 dark:bg-brand-primary/20 border border-brand-primary/20 dark:border-brand-primary/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-brand-primary rounded-full"></div>
            <div>
              <h3 className="font-semibold text-brand-primary dark:text-brand-light">
                Your Assigned Center: {userCenter.name}
              </h3>
              <p className="text-sm text-brand-primary/80 dark:text-brand-light/80">
                {userCenter.address}, {userCenter.city}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Workstation Selection */}
      {userCenter && !error.center && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Workstation
          </h3>
          
          {loading.workstations && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading workstations...</span>
            </div>
          )}

          {error.workstations && (
            <div className="text-center py-8">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400">{error.workstations}</p>
              </div>
            </div>
          )}

          {!loading.workstations && !error.workstations && workstations.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.563M15 8.5a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">No workstations available</p>
              <p>There are no workstations in your assigned center at the moment.</p>
            </div>
          )}

          {!loading.workstations && !error.workstations && workstations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workstations.map((workstation) => (
                <button
                  key={workstation.id}
                  onClick={() => handleWorkstationSelect(workstation)}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
                    selectedWorkstation?.id === workstation.id
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Workstation Image */}
                    <div className="w-full h-32 overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                      {workstation.imageUrl ? (
                        <img 
                          src={`${window.location.protocol}//${window.location.hostname}:8080${workstation.imageUrl}`}
                          alt={`${workstation.name} workstation`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                              <div class="flex items-center justify-center h-full">
                                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                          </svg>
                          <span className="text-xs">No image</span>
                        </div>
                      )}
                    </div>
                    
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {workstation.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {workstation.room?.name}
                      </p>
                      {workstation.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {workstation.description}
                        </p>
                      )}

                                                {/* Specifications Display */}
                        {workstation.specifications && workstation.specifications.trim() !== '' && workstation.specifications !== '{}' && (
                          <div className="mt-3 space-y-1">
                            <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300">Specifications:</h5>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                              <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {workstation.specifications}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Basic Info when no specifications */}
                        {workstation.position && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium">Position:</span> {workstation.position}
                            </p>
                          </div>
                        )}
                    </div>
                    <div className="ml-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        workstation.status === 'AVAILABLE' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : workstation.status === 'OCCUPIED' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {workstation.status?.toLowerCase() || 'Unknown'}
                      </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Time Slot Calendar */}
      {showCalendar && selectedWorkstation && (
        <TimeSlotCalendar
          workstationId={selectedWorkstation.id}
          workstationName={selectedWorkstation.name}
          onSlotSelect={handleSlotSelect}
        />
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModal.isOpen}
        onClose={handleBookingModalClose}
        slot={bookingModal.slot}
        date={bookingModal.date}
        workstation={selectedWorkstation}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* AI Recommendation Modal */}
      <RecommendationModal
        isOpen={recommendationModal}
        onClose={() => setRecommendationModal(false)}
        onSelectRecommendation={handleRecommendationSelect}
        centerId={userCenter?.id}
      />
    </div>
  );
};

export default WorkstationSearch; 