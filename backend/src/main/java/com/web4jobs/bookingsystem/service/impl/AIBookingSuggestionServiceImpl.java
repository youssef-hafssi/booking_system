package com.web4jobs.bookingsystem.service.impl;

import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;
import com.web4jobs.bookingsystem.dto.ai.BookingSuggestionRequest;
import com.web4jobs.bookingsystem.dto.ai.BookingSuggestionResponse;
import com.web4jobs.bookingsystem.model.*;
import com.web4jobs.bookingsystem.repository.*;
import com.web4jobs.bookingsystem.service.AIBookingSuggestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI-powered booking suggestion service implementation
 * Combines local data analysis with OpenAI for intelligent recommendations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIBookingSuggestionServiceImpl implements AIBookingSuggestionService {

    private final OpenAiService openAiService;
    private final ReservationRepository reservationRepository;
    private final WorkStationRepository workStationRepository;
    private final UserRepository userRepository;
    private final CenterRepository centerRepository;

    @Value("${openai.model:gpt-3.5-turbo}")
    private String openAiModel;

    @Value("${openai.max.tokens:500}")
    private Integer maxTokens;

    @Value("${openai.temperature:0.7}")
    private Double temperature;

    @Override
    public BookingSuggestionResponse generateBookingSuggestion(BookingSuggestionRequest request) {
        log.info("Generating AI booking suggestion for user {} at center {}", request.getUserId(), request.getCenterId());

        try {
            // 1. Analyze user's booking history
            Map<String, Object> userAnalysis = analyzeUserHistory(request.getUserId());
            
            // 2. Get available workstations
            List<WorkStation> availableWorkstations = getAvailableWorkstations(request);
            
            // 3. Analyze current center activity
            Map<String, Object> centerActivity = analyzeCenterActivity(request.getCenterId(), request.getPreferredDate());
            
            // 4. Generate AI-powered recommendation
            WorkStation recommendedWorkstation = selectOptimalWorkstation(availableWorkstations, userAnalysis, request);
            
            // 5. Calculate optimal time slot
            LocalDateTime[] optimalTimeSlot = calculateOptimalTimeSlot(request, centerActivity);
            
            // 6. Generate AI reasoning
            String aiReasoning = generateAIReasoning(request, recommendedWorkstation, userAnalysis, centerActivity);
            
            // 7. Build response
            return BookingSuggestionResponse.builder()
                    .recommendedWorkstationId(recommendedWorkstation.getId())
                    .workstationName(recommendedWorkstation.getName())
                    .roomName(recommendedWorkstation.getRoom().getName())
                    .centerName(recommendedWorkstation.getRoom().getCenter().getName())
                    .suggestedStartTime(optimalTimeSlot[0])
                    .suggestedEndTime(optimalTimeSlot[1])
                    .confidenceScore(calculateConfidenceScore(userAnalysis, centerActivity))
                    .reasoning(aiReasoning)
                    .workstationSpecs(summarizeWorkstationSpecs(recommendedWorkstation))
                    .environmentDescription(getEnvironmentDescription(recommendedWorkstation, centerActivity))
                    .build();

        } catch (Exception e) {
            log.error("Error generating booking suggestion", e);
            // Fallback to simple recommendation
            return generateFallbackSuggestion(request);
        }
    }

    /**
     * Analyze user's historical booking patterns
     */
    private Map<String, Object> analyzeUserHistory(Long userId) {
        List<Reservation> userReservations = reservationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        Map<String, Object> analysis = new HashMap<>();
        
        if (userReservations.isEmpty()) {
            analysis.put("isNewUser", true);
            analysis.put("preferredTime", "morning");
            analysis.put("averageDuration", 2);
            return analysis;
        }

        // Analyze preferred time slots
        Map<String, Long> timePreferences = userReservations.stream()
                .collect(Collectors.groupingBy(
                    r -> getTimeSlot(r.getStartTime().toLocalTime()),
                    Collectors.counting()
                ));
        
        // Analyze preferred workstation types
        Map<String, Long> workstationPreferences = userReservations.stream()
                .filter(r -> r.getWorkStation() != null)
                .collect(Collectors.groupingBy(
                    r -> r.getWorkStation().getName(),
                    Collectors.counting()
                ));

        // Calculate average duration
        double avgDuration = userReservations.stream()
                .filter(r -> r.getStartTime() != null && r.getEndTime() != null)
                .mapToLong(r -> java.time.Duration.between(r.getStartTime(), r.getEndTime()).toHours())
                .average()
                .orElse(2.0);

        analysis.put("isNewUser", false);
        analysis.put("preferredTime", timePreferences.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("morning"));
        analysis.put("preferredWorkstations", workstationPreferences);
        analysis.put("averageDuration", (int) Math.ceil(avgDuration));
        analysis.put("totalBookings", userReservations.size());
        
        return analysis;
    }

    /**
     * Get available workstations based on request criteria
     */
    private List<WorkStation> getAvailableWorkstations(BookingSuggestionRequest request) {
        // Get all workstations in the center
        List<WorkStation> workstations = workStationRepository.findByRoomCenterId(request.getCenterId());
        
        // Filter available ones (this would need to check against existing reservations)
        return workstations.stream()
                .filter(ws -> ws.getStatus() == WorkStationStatus.AVAILABLE)
                .collect(Collectors.toList());
    }

    /**
     * Analyze current activity levels at the center
     */
    private Map<String, Object> analyzeCenterActivity(Long centerId, java.time.LocalDate date) {
        Map<String, Object> activity = new HashMap<>();
        
        // Get reservations for the day
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        
        List<Reservation> dayReservations = reservationRepository.findByWorkStationRoomCenterIdAndStartTimeBetween(
                centerId, startOfDay, endOfDay);
        
        // Calculate activity by time slots
        Map<String, Integer> activityByHour = new HashMap<>();
        for (int hour = 8; hour <= 18; hour++) {
            final int currentHour = hour; // Make effectively final for lambda
            String timeSlot = hour + ":00";
            long count = dayReservations.stream()
                    .filter(r -> r.getStartTime().getHour() <= currentHour && r.getEndTime().getHour() > currentHour)
                    .count();
            activityByHour.put(timeSlot, (int) count);
        }
        
        activity.put("activityByHour", activityByHour);
        activity.put("totalReservations", dayReservations.size());
        activity.put("peakHour", activityByHour.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("14:00"));
        
        return activity;
    }

    /**
     * Select the optimal workstation using scoring algorithm
     */
    private WorkStation selectOptimalWorkstation(List<WorkStation> available, 
                                               Map<String, Object> userAnalysis, 
                                               BookingSuggestionRequest request) {
        
        if (available.isEmpty()) {
            throw new RuntimeException("No available workstations found");
        }

        // Simple scoring for now - can be enhanced with more sophisticated AI
        return available.stream()
                .max(Comparator.comparingInt(ws -> calculateWorkstationScore(ws, userAnalysis, request)))
                .orElse(available.get(0));
    }

    /**
     * Calculate workstation score based on user preferences and requirements
     */
    private int calculateWorkstationScore(WorkStation workstation, 
                                        Map<String, Object> userAnalysis, 
                                        BookingSuggestionRequest request) {
        int score = 0;
        
        // Base score
        score += 50;
        
        // User history bonus
        if (!((Boolean) userAnalysis.get("isNewUser"))) {
            @SuppressWarnings("unchecked")
            Map<String, Long> preferredWorkstations = (Map<String, Long>) userAnalysis.get("preferredWorkstations");
            if (preferredWorkstations.containsKey(workstation.getName())) {
                score += 30;
            }
        }
        
        // Environment preference matching
        if ("quiet".equals(request.getEnvironmentPreference())) {
            // Prefer workstations in smaller rooms or specific quiet areas
            if (workstation.getRoom().getCapacity() < 20) {
                score += 20;
            }
        }
        
        return score;
    }

    /**
     * Calculate optimal time slot based on preferences and activity
     */
    private LocalDateTime[] calculateOptimalTimeSlot(BookingSuggestionRequest request, 
                                                   Map<String, Object> centerActivity) {
        LocalTime startTime = request.getPreferredStartTime();
        int duration = request.getDurationHours() != null ? request.getDurationHours() : 2;
        
        if (startTime == null) {
            // Use default based on activity analysis
            startTime = LocalTime.of(10, 0); // Default to 10 AM
        }
        
        LocalDateTime suggestedStart = request.getPreferredDate().atTime(startTime);
        LocalDateTime suggestedEnd = suggestedStart.plusHours(duration);
        
        return new LocalDateTime[]{suggestedStart, suggestedEnd};
    }

    /**
     * Generate AI-powered reasoning using OpenAI
     */
    private String generateAIReasoning(BookingSuggestionRequest request, 
                                     WorkStation workstation, 
                                     Map<String, Object> userAnalysis, 
                                     Map<String, Object> centerActivity) {
        try {
            String prompt = buildAIPrompt(request, workstation, userAnalysis, centerActivity);
            
            List<ChatMessage> messages = Arrays.asList(
                new ChatMessage(ChatMessageRole.SYSTEM.value(), 
                    "Tu es un assistant IA spécialisé dans les réservations de postes de travail. " +
                    "Explique pourquoi cette suggestion est optimale de manière concise et amicale en français."),
                new ChatMessage(ChatMessageRole.USER.value(), prompt)
            );

            ChatCompletionRequest completionRequest = ChatCompletionRequest.builder()
                    .model(openAiModel)
                    .messages(messages)
                    .maxTokens(maxTokens)
                    .temperature(temperature)
                    .build();

            String response = openAiService.createChatCompletion(completionRequest)
                    .getChoices().get(0).getMessage().getContent();
            
            return response.trim();
            
        } catch (Exception e) {
            log.error("Error generating AI reasoning", e);
            return generateFallbackReasoning(workstation, userAnalysis);
        }
    }

    /**
     * Build prompt for OpenAI based on all available context
     */
    private String buildAIPrompt(BookingSuggestionRequest request, 
                               WorkStation workstation, 
                               Map<String, Object> userAnalysis, 
                               Map<String, Object> centerActivity) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Contexte de réservation:\n");
        prompt.append("- Poste recommandé: ").append(workstation.getName()).append("\n");
        prompt.append("- Salle: ").append(workstation.getRoom().getName()).append("\n");
        prompt.append("- Type de travail: ").append(request.getWorkType()).append("\n");
        prompt.append("- Préférence d'environnement: ").append(request.getEnvironmentPreference()).append("\n");
        
        if (!(Boolean) userAnalysis.get("isNewUser")) {
            prompt.append("- Utilisateur régulier avec ").append(userAnalysis.get("totalBookings")).append(" réservations\n");
            prompt.append("- Préfère généralement: ").append(userAnalysis.get("preferredTime")).append("\n");
        } else {
            prompt.append("- Nouvel utilisateur\n");
        }
        
        prompt.append("- Affluence du centre: ").append(centerActivity.get("totalReservations")).append(" réservations aujourd'hui\n");
        
        prompt.append("\nExplique en 2-3 phrases pourquoi ce choix est optimal.");
        
        return prompt.toString();
    }

    // Helper methods
    private String getTimeSlot(LocalTime time) {
        int hour = time.getHour();
        if (hour < 12) return "morning";
        if (hour < 17) return "afternoon";
        return "evening";
    }

    private int calculateConfidenceScore(Map<String, Object> userAnalysis, Map<String, Object> centerActivity) {
        int baseScore = 70;
        
        if (!(Boolean) userAnalysis.get("isNewUser")) {
            baseScore += 20; // More confident with returning users
        }
        
        return Math.min(95, baseScore);
    }

    private String summarizeWorkstationSpecs(WorkStation workstation) {
        return workstation.getSpecifications() != null ? 
               workstation.getSpecifications().substring(0, Math.min(100, workstation.getSpecifications().length())) + "..." :
               "Spécifications standard";
    }

    private String getEnvironmentDescription(WorkStation workstation, Map<String, Object> centerActivity) {
        int totalReservations = (Integer) centerActivity.get("totalReservations");
        
        if (totalReservations < 5) {
            return "Environnement calme";
        } else if (totalReservations < 15) {
            return "Activité modérée";
        } else {
            return "Environnement dynamique";
        }
    }

    private String generateFallbackReasoning(WorkStation workstation, Map<String, Object> userAnalysis) {
        return String.format("Poste %s recommandé pour ses spécifications et sa disponibilité. " +
                           "Localisation optimale dans %s.", 
                           workstation.getName(), 
                           workstation.getRoom().getName());
    }

    private BookingSuggestionResponse generateFallbackSuggestion(BookingSuggestionRequest request) {
        // Simple fallback when AI fails
        List<WorkStation> available = getAvailableWorkstations(request);
        if (available.isEmpty()) {
            throw new RuntimeException("No workstations available");
        }
        
        WorkStation fallbackWs = available.get(0);
        LocalDateTime startTime = request.getPreferredDate().atTime(10, 0);
        
        return BookingSuggestionResponse.builder()
                .recommendedWorkstationId(fallbackWs.getId())
                .workstationName(fallbackWs.getName())
                .roomName(fallbackWs.getRoom().getName())
                .centerName(fallbackWs.getRoom().getCenter().getName())
                .suggestedStartTime(startTime)
                .suggestedEndTime(startTime.plusHours(2))
                .confidenceScore(60)
                .reasoning("Suggestion basique basée sur la disponibilité.")
                .workstationSpecs("Spécifications standard")
                .environmentDescription("Standard")
                .build();
    }

    @Override
    public BookingSuggestionResponse getAlternativeSuggestions(BookingSuggestionRequest request, Long excludeWorkstationId) {
        // Implementation for alternative suggestions
        return generateBookingSuggestion(request); // Simplified for now
    }
} 