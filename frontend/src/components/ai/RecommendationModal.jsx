import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { BsX, BsClock, BsCalendar, BsLaptop, BsStars, BsLightbulb, BsCheckCircle, BsGear } from 'react-icons/bs';

const RecommendationModal = ({ isOpen, onClose, onSelectRecommendation, centerId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: smart loading, 2: recommendations, 3: custom form
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Custom preferences state (only used when user chooses custom)
  const [customPreferences, setCustomPreferences] = useState({
    preferredDate: format(new Date(), 'yyyy-MM-dd'),
    preferredStartTime: '09:00',
    preferredDuration: 2,
    preferredWorkStationType: '',
    preferQuietEnvironment: true,
    purpose: 'study',
    flexibility: 3
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setRecommendations([]);
      setShowCustomForm(false);
      // Automatically start AI analysis
      generateSmartRecommendations();
    }
  }, [isOpen]);

  const generateSmartRecommendations = async () => {
    setLoading(true);
    setError(null);
    setStep(1);
    
    try {
      // Let AI automatically determine everything
      const response = await api.ai.quickRecommend(user.id, centerId);
      setRecommendations(response.data.recommendations || []);
      setStep(2);
    } catch (err) {
      console.error('Error generating smart recommendations:', err);
      setError('L\'IA ne peut pas générer de recommandations automatiques pour le moment.');
    } finally {
      setLoading(false);
    }
  };

  const generateCustomRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const request = {
        userId: user.id,
        centerId: centerId,
        preferredDate: customPreferences.preferredDate,
        preferredStartTime: customPreferences.preferredStartTime,
        preferredDuration: customPreferences.preferredDuration,
        preferredWorkStationType: customPreferences.preferredWorkStationType || null,
        preferQuietEnvironment: customPreferences.preferQuietEnvironment,
        purpose: customPreferences.purpose,
        flexibility: customPreferences.flexibility
      };

      const response = await api.ai.generateRecommendations(request);
      setRecommendations(response.data.recommendations || []);
      setStep(2);
      setShowCustomForm(false);
    } catch (err) {
      console.error('Error generating custom recommendations:', err);
      setError('Impossible de générer les recommandations personnalisées.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecommendation = (recommendation) => {
    const bookingData = {
      workstation: {
        id: recommendation.workstationId,
        name: recommendation.workstationName,
        type: recommendation.workstationType,
        room: { name: recommendation.roomName, floor: recommendation.floor },
        specifications: recommendation.specifications
      },
      slot: {
        startTime: recommendation.suggestedStartTime,
        timeLabel: format(new Date(recommendation.suggestedStartTime), 'HH:mm')
      },
      date: new Date(recommendation.suggestedStartTime).toISOString().split('T')[0],
      duration: recommendation.duration
    };
    
    onSelectRecommendation(bookingData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <BsLightbulb className="text-2xl" />
            <h2 className="text-xl font-bold">Assistant IA - Recommandations Intelligentes</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <BsX size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* Step 1: Smart AI Analysis */}
          {step === 1 && (
            <div className="space-y-6 text-center">
              <div className="mb-8">
                {loading ? (
                  <div className="relative">
                    <div className="animate-spin w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                  </div>
                ) : (
                  <BsStars className="text-5xl text-blue-600 mx-auto mb-4" />
                )}
                
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                  {loading ? '🧠 Analyse intelligente en cours...' : '✨ Assistant IA Prêt'}
                </h3>
                
                {loading ? (
                  <div className="space-y-3 text-gray-600">
                    <p className="flex items-center justify-center gap-2">
                      <span className="animate-pulse">📊</span> Analyse de votre historique de réservations
                    </p>
                    <p className="flex items-center justify-center gap-2">
                      <span className="animate-pulse">🏢</span> Évaluation du contexte actuel du centre
                    </p>
                    <p className="flex items-center justify-center gap-2">
                      <span className="animate-pulse">⏰</span> Calcul des créneaux optimaux
                    </p>
                    <p className="flex items-center justify-center gap-2">
                      <span className="animate-pulse">🎯</span> Sélection des meilleurs postes disponibles
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600 text-lg">
                    L'IA va automatiquement analyser vos préférences et le contexte actuel pour vous proposer les meilleures options
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
                  <p className="mb-4 font-medium">{error}</p>
                  <div className="space-x-3">
                    <button
                      onClick={generateSmartRecommendations}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Réessayer l'IA
                    </button>
                    <button
                      onClick={() => setShowCustomForm(true)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Utiliser mes préférences
                    </button>
                  </div>
                </div>
              )}

              {!loading && !error && (
                <div className="space-x-4">
                  <button
                    onClick={generateSmartRecommendations}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 mx-auto"
                  >
                    <BsStars />
                    Recommandations Intelligentes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Custom Preferences Form */}
          {showCustomForm && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <BsGear className="text-4xl text-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Personnaliser les Préférences
                </h3>
                <p className="text-gray-600">
                  Définissez vos préférences pour des recommandations sur mesure
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date préférée
                  </label>
                  <input
                    type="date"
                    value={customPreferences.preferredDate}
                    onChange={(e) => setCustomPreferences(prev => ({ ...prev, preferredDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure de début
                  </label>
                  <input
                    type="time"
                    value={customPreferences.preferredStartTime}
                    onChange={(e) => setCustomPreferences(prev => ({ ...prev, preferredStartTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée (heures)
                  </label>
                  <select
                    value={customPreferences.preferredDuration}
                    onChange={(e) => setCustomPreferences(prev => ({ ...prev, preferredDuration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1 heure</option>
                    <option value={2}>2 heures</option>
                    <option value={3}>3 heures</option>
                    <option value={4}>4 heures</option>
                    <option value={6}>6 heures</option>
                    <option value={8}>8 heures</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de poste
                  </label>
                  <select
                    value={customPreferences.preferredWorkStationType}
                    onChange={(e) => setCustomPreferences(prev => ({ ...prev, preferredWorkStationType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Aucune préférence</option>
                    <option value="DESKTOP">Desktop</option>
                    <option value="LAPTOP">Laptop</option>
                    <option value="SPECIALIZED">Spécialisé</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="quietEnvironment"
                  checked={customPreferences.preferQuietEnvironment}
                  onChange={(e) => setCustomPreferences(prev => ({ ...prev, preferQuietEnvironment: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="quietEnvironment" className="text-sm text-gray-700">
                  Préférer un environnement calme
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCustomForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={generateCustomRecommendations}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Génération...' : 'Générer les Recommandations'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: AI Recommendations Results */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <BsCheckCircle className="text-4xl text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-800">
                  🎯 Recommandations IA Personnalisées
                </h3>
                <p className="text-gray-600">
                  Sélectionnez la recommandation qui vous convient le mieux
                </p>
              </div>

              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Aucune recommandation disponible pour le moment</p>
                  <div className="space-x-3">
                    <button
                      onClick={generateSmartRecommendations}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Réessayer l'IA
                    </button>
                    <button
                      onClick={() => setShowCustomForm(true)}
                      className="text-gray-600 hover:text-gray-700"
                    >
                      Préférences personnalisées
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div
                      key={rec.workstationId}
                      className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-r from-white to-gray-50"
                      onClick={() => handleSelectRecommendation(rec)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                            index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' : 
                            'bg-gradient-to-r from-orange-400 to-orange-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-gray-800">{rec.workstationName}</h4>
                            <p className="text-gray-600">{rec.roomName} - Étage {rec.floor}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{Math.round(rec.score)}%</div>
                          <div className="text-xs text-gray-500">Compatibilité</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <BsClock className="text-blue-500" />
                          <span className="font-medium">
                            {format(new Date(rec.suggestedStartTime), 'HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <BsCalendar className="text-green-500" />
                          <span className="font-medium">{rec.duration}h</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <BsLaptop className="text-purple-500" />
                          <span className="font-medium">{rec.workstationType}</span>
                        </div>
                        <div className="text-gray-700">
                          {rec.isOptimalTime && <span className="text-green-600 font-medium">✓ Heure optimale</span>}
                        </div>
                      </div>

                      {rec.advantages && rec.advantages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {rec.advantages.slice(0, 2).map((advantage, i) => (
                            <span key={i} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              {advantage}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={() => setShowCustomForm(true)}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <BsGear className="inline mr-2" />
                  Personnaliser
                </button>
                <button
                  onClick={generateSmartRecommendations}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <BsStars className="inline mr-2" />
                  Nouvelles Recommandations
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationModal; 