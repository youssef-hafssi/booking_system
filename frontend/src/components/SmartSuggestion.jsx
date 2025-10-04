import React, { useState } from 'react';
import { HiSparkles, HiCheck, HiX, HiRefresh, HiClock, HiLocationMarker } from 'react-icons/hi';
import { aiBookingService } from '../services/aiBookingService';

const SmartSuggestion = ({ 
  isVisible, 
  onClose, 
  onAccept, 
  userContext, 
  workstationOptions,
  selectedDate,
  selectedWorkstation 
}) => {
  const [suggestion, setSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const generateSuggestion = async () => {
    setIsLoading(true);
    
    try {
      const requestData = {
        userId: userContext.id,
        centerId: userContext.centerId,
        preferredDate: selectedDate,
        preferredStartTime: null, // Let AI decide optimal time
        durationHours: 2, // Default 2 hours
        workType: 'general', // Could be extracted from user preferences
        environmentPreference: 'any', // Could be user preference
        specificRequirements: null
      };

      const aiSuggestion = await aiBookingService.generateSuggestion(requestData);
      const formattedSuggestion = aiBookingService.formatSuggestion(aiSuggestion);
      
      setSuggestion(formattedSuggestion);
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      // Show error state
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (suggestion) {
      onAccept({
        workstationId: suggestion.recommendedWorkstationId,
        startTime: suggestion.suggestedStartTime,
        endTime: suggestion.suggestedEndTime,
        reasoning: suggestion.reasoning
      });
      onClose();
    }
  };

  const handleGetAlternatives = async () => {
    if (!suggestion) return;
    
    setIsLoading(true);
    try {
      const alternatives = await aiBookingService.getAlternatives(
        {
          userId: userContext.id,
          centerId: userContext.centerId,
          preferredDate: selectedDate,
          durationHours: 2
        },
        suggestion.recommendedWorkstationId
      );
      
      setShowAlternatives(true);
      // Handle alternatives display
    } catch (error) {
      console.error('Error getting alternatives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate suggestion when component becomes visible
  React.useEffect(() => {
    if (isVisible && !suggestion && !isLoading) {
      generateSuggestion();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
              <HiSparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Suggestion Intelligente
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <HiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                L'IA analyse vos préférences...
              </p>
            </div>
          ) : suggestion ? (
            <div className="space-y-6">
              {/* Main Suggestion Card */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <HiLocationMarker className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {suggestion.workstationName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {suggestion.roomName} • {suggestion.centerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      {suggestion.confidenceScore}% confiance
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <HiClock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {suggestion.formattedTimeSlot}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({suggestion.formattedDate})
                  </span>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Spécifications:</span> {suggestion.workstationSpecs}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    <span className="font-medium">Environnement:</span> {suggestion.environmentDescription}
                  </p>
                </div>

                {/* AI Reasoning */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <HiSparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">
                        Pourquoi cette suggestion
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {suggestion.reasoning}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAcceptSuggestion}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                >
                  <HiCheck className="w-5 h-5" />
                  Accepter la suggestion
                </button>
                
                <button
                  onClick={handleGetAlternatives}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  <HiRefresh className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={onClose}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Je préfère choisir manuellement
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Impossible de générer une suggestion pour le moment.
              </p>
              <button
                onClick={generateSuggestion}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartSuggestion; 