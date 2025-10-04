import { apiClient } from './api';

/**
 * Service for AI-powered booking suggestions
 */
export const aiBookingService = {
  /**
   * Generate intelligent booking suggestion
   */
  generateSuggestion: async (requestData) => {
    try {
      console.log('🤖 Generating AI booking suggestion:', requestData);
      
      const response = await apiClient.post('/ai/suggest-booking', requestData);
      console.log('✅ AI suggestion received:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error generating AI suggestion:', error);
      throw new Error('Failed to generate AI suggestion. Please try again.');
    }
  },

  /**
   * Get alternative suggestions
   */
  getAlternatives: async (requestData, excludeWorkstationId) => {
    try {
      console.log('🔄 Getting alternative suggestions...');
      
      const response = await apiClient.post('/ai/suggest-alternatives', requestData, {
        params: { excludeWorkstationId }
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Error getting alternatives:', error);
      throw new Error('Failed to get alternative suggestions.');
    }
  },

  /**
   * Format suggestion for display
   */
  formatSuggestion: (suggestion) => {
    const startTime = new Date(suggestion.suggestedStartTime);
    const endTime = new Date(suggestion.suggestedEndTime);
    
    return {
      ...suggestion,
      formattedTimeSlot: `${startTime.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })} - ${endTime.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`,
      formattedDate: startTime.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  }
}; 