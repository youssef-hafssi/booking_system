package com.web4jobs.bookingsystem.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.web4jobs.bookingsystem.dto.ai.RecommendationRequest;
import com.web4jobs.bookingsystem.dto.ai.RecommendationResponse;
import com.web4jobs.bookingsystem.dto.ai.UserBookingProfile;
import com.web4jobs.bookingsystem.model.*;
import com.web4jobs.bookingsystem.repository.*;
import com.web4jobs.bookingsystem.service.AiRecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiRecommendationServiceImpl implements AiRecommendationService {

    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;
    private final WorkStationRepository workStationRepository;
    private final RoomRepository roomRepository;
    private final CenterRepository centerRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${openai.api.key}")
    private String openaiApiKey;

    @Value("${openai.api.url}")
    private String openaiApiUrl;

    @Override
    public RecommendationResponse generateRecommendations(RecommendationRequest request) {
        log.info("Generating AI recommendations for user: {}", request.getUserId());
        
        try {
            // 1. Analyze user profile
            UserBookingProfile userProfile = analyzeUserBookingProfile(request.getUserId());
            
            // 2. Get available workstations
            List<WorkStation> availableWorkstations = getAvailableWorkstations(request);
            
            // 3. Get context analysis
            String contextAnalysis = getCurrentContextAnalysis(request.getCenterId());
            
            // 4. Generate AI recommendations using OpenAI
            String aiPrompt = buildRecommendationPrompt(request, userProfile, availableWorkstations, contextAnalysis);
            String aiResponse = callOpenAI(aiPrompt);
            
            // 5. Parse AI response and create recommendations
            return parseAiResponse(aiResponse, availableWorkstations, request);
            
        } catch (Exception e) {
            log.error("Error generating recommendations", e);
            // Fallback to rule-based recommendations
            return generateFallbackRecommendations(request);
        }
    }

    @Override
    public UserBookingProfile analyzeUserBookingProfile(Long userId) {
        log.info("Analyzing booking profile for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get user's reservation history (last 6 months)
        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6);
        List<Reservation> userReservations = reservationRepository.findByUserAndCreatedAtAfter(user, sixMonthsAgo);
        
        if (userReservations.isEmpty()) {
            return createNewUserProfile(userId);
        }
        
        // Analyze patterns
        Map<String, Integer> workstationTypeUsage = analyzeWorkstationTypeUsage(userReservations);
        List<Integer> preferredDaysOfWeek = analyzePreferredDays(userReservations);
        LocalTime preferredStartTime = analyzePreferredStartTime(userReservations);
        Double averageDuration = calculateAverageDuration(userReservations);
        
        return UserBookingProfile.builder()
                .userId(userId)
                .totalBookings(userReservations.size())
                .averageDuration(averageDuration)
                .preferredStartTime(preferredStartTime)
                .preferredDaysOfWeek(preferredDaysOfWeek)
                .preferredTimeSlot(determinePreferredTimeSlot(preferredStartTime))
                .mostUsedWorkstationType(getMostUsedType(workstationTypeUsage))
                .workstationTypeUsage(workstationTypeUsage)
                .punctualityScore(calculatePunctualityScore(userReservations))
                .cancellationRate(calculateCancellationRate(userReservations))
                .averageAdvanceBooking(calculateAverageAdvanceBooking(userReservations))
                .prefersQuietSpaces(inferQuietPreference(userReservations))
                .activityPattern(determineActivityPattern(userReservations))
                .recentBookingsCount(countRecentBookings(userReservations))
                .recentTrend(analyzeRecentTrend(userReservations))
                .build();
    }

    @Override
    public String getCurrentContextAnalysis(Long centerId) {
        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Center not found"));
        
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        
        // Get current day reservations
        List<Reservation> todayReservations = reservationRepository.findByWorkStationRoomCenterAndStartTimeBetween(
                center, today.atStartOfDay(), today.plusDays(1).atStartOfDay());
        
        // Calculate occupancy by hour
        Map<Integer, Long> hourlyOccupancy = todayReservations.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getStartTime().getHour(),
                        Collectors.counting()
                ));
        
        // Get total workstations in center
        long totalWorkstations = workStationRepository.countByRoomCenterId(centerId);
        
        StringBuilder context = new StringBuilder();
        context.append("Current Context Analysis:\n");
        context.append("Center: ").append(center.getName()).append("\n");
        context.append("Current Time: ").append(now.format(DateTimeFormatter.ofPattern("HH:mm"))).append("\n");
        context.append("Day of Week: ").append(now.getDayOfWeek()).append("\n");
        context.append("Total Workstations: ").append(totalWorkstations).append("\n");
        context.append("Current Hour Occupancy: ");
        
        int currentHour = now.getHour();
        long currentOccupancy = hourlyOccupancy.getOrDefault(currentHour, 0L);
        double occupancyRate = totalWorkstations > 0 ? (currentOccupancy * 100.0 / totalWorkstations) : 0;
        context.append(String.format("%.1f%%", occupancyRate)).append("\n");
        
        // Peak hours analysis
        context.append("Peak Hours Today: ");
        hourlyOccupancy.entrySet().stream()
                .sorted(Map.Entry.<Integer, Long>comparingByValue().reversed())
                .limit(3)
                .forEach(entry -> context.append(entry.getKey()).append("h (")
                        .append(String.format("%.1f%%)", entry.getValue() * 100.0 / totalWorkstations))
                        .append(" "));
        
        return context.toString();
    }

    private List<WorkStation> getAvailableWorkstations(RecommendationRequest request) {
        LocalDate searchDate = request.getPreferredDate() != null ? 
                request.getPreferredDate() : LocalDate.now();
        
        // Get all workstations in the center
        List<WorkStation> allWorkstations = workStationRepository.findByRoomCenterId(request.getCenterId());
        
        // Filter available workstations
        return allWorkstations.stream()
                .filter(ws -> ws.getStatus() == WorkStationStatus.AVAILABLE)
                .collect(Collectors.toList());
    }

    private String buildRecommendationPrompt(RecommendationRequest request, UserBookingProfile profile, 
                                           List<WorkStation> availableWorkstations, String contextAnalysis) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("You are an AI assistant for a workstation booking system. ");
        prompt.append("Analyze the following information and provide intelligent recommendations.\n\n");
        
        // User profile
        prompt.append("USER PROFILE:\n");
        prompt.append("- Total bookings: ").append(profile.getTotalBookings()).append("\n");
        prompt.append("- Preferred start time: ").append(profile.getPreferredStartTime()).append("\n");
        prompt.append("- Most used workstation type: ").append(profile.getMostUsedWorkstationType()).append("\n");
        prompt.append("- Average duration: ").append(String.format("%.1f hours", profile.getAverageDuration())).append("\n");
        prompt.append("- Prefers quiet spaces: ").append(profile.getPrefersQuietSpaces()).append("\n");
        prompt.append("- Activity pattern: ").append(profile.getActivityPattern()).append("\n\n");
        
        // Current request
        prompt.append("CURRENT REQUEST:\n");
        prompt.append("- Preferred date: ").append(request.getPreferredDate()).append("\n");
        prompt.append("- Preferred start time: ").append(request.getPreferredStartTime()).append("\n");
        prompt.append("- Duration: ").append(request.getPreferredDuration()).append(" hours\n");
        prompt.append("- Purpose: ").append(request.getPurpose()).append("\n");
        prompt.append("- Prefers quiet environment: ").append(request.getPreferQuietEnvironment()).append("\n\n");
        
        // Context
        prompt.append("CURRENT CONTEXT:\n");
        prompt.append(contextAnalysis).append("\n\n");
        
        // Available workstations
        prompt.append("AVAILABLE WORKSTATIONS:\n");
        for (WorkStation ws : availableWorkstations) {
            String wsType = ws.getType() != null ? ws.getType().toString() : "DESKTOP";
            prompt.append("- ID: ").append(ws.getId())
                    .append(", Name: ").append(ws.getName())
                    .append(", Type: ").append(wsType)
                    .append(", Room: ").append(ws.getRoom().getName())
                    .append(", Floor: ").append(ws.getRoom().getFloor())
                    .append(", Specs: ").append(ws.getSpecifications()).append("\n");
        }
        
        prompt.append("\nProvide 3 top recommendations with the following JSON format:\n");
        prompt.append("{\n");
        prompt.append("  \"recommendations\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"workstationId\": 1,\n");
        prompt.append("      \"score\": 95,\n");
        prompt.append("      \"reason\": \"explanation\",\n");
        prompt.append("      \"suggestedStartTime\": \"HH:mm\",\n");
        prompt.append("      \"advantages\": [\"advantage1\", \"advantage2\"]\n");
        prompt.append("    }\n");
        prompt.append("  ],\n");
        prompt.append("  \"reasoning\": \"overall analysis\",\n");
        prompt.append("  \"confidenceScore\": 0.85\n");
        prompt.append("}\n");
        
        return prompt.toString();
    }

    private String callOpenAI(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);
        // Add OpenRouter specific headers (optional for rankings)
        headers.set("HTTP-Referer", "http://localhost:8080");
        headers.set("X-Title", "Workstation Booking AI Assistant");
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "openai/gpt-oss-20b:free");
        requestBody.put("max_tokens", 1000);
        requestBody.put("temperature", 0.7);
        
        List<Map<String, String>> messages = new ArrayList<>();
        Map<String, String> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);
        messages.add(message);
        requestBody.put("messages", messages);
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    openaiApiUrl, HttpMethod.POST, entity, String.class);
            
            JsonNode responseJson = objectMapper.readTree(response.getBody());
            return responseJson.path("choices").get(0).path("message").path("content").asText();
            
        } catch (Exception e) {
            log.error("Error calling OpenAI API", e);
            throw new RuntimeException("Failed to get AI recommendation", e);
        }
    }

    private RecommendationResponse parseAiResponse(String aiResponse, List<WorkStation> availableWorkstations, RecommendationRequest request) {
        try {
            // Clean the AI response - remove markdown code blocks if present
            String cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith("```json")) {
                cleanedResponse = cleanedResponse.substring(7); // Remove ```json
            }
            if (cleanedResponse.startsWith("```")) {
                cleanedResponse = cleanedResponse.substring(3); // Remove ```
            }
            if (cleanedResponse.endsWith("```")) {
                cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length() - 3); // Remove ending ```
            }
            cleanedResponse = cleanedResponse.trim();
            
            JsonNode jsonResponse = objectMapper.readTree(cleanedResponse);
            
            List<RecommendationResponse.WorkstationRecommendation> recommendations = new ArrayList<>();
            JsonNode recommendationsNode = jsonResponse.path("recommendations");
            
            for (JsonNode recNode : recommendationsNode) {
                Long workstationId = recNode.path("workstationId").asLong();
                WorkStation workstation = availableWorkstations.stream()
                        .filter(ws -> ws.getId().equals(workstationId))
                        .findFirst()
                        .orElse(null);
                
                if (workstation != null) {
                    LocalDateTime suggestedStart = calculateSuggestedStartTime(
                            recNode.path("suggestedStartTime").asText(), request.getPreferredDate());
                    
                    String wsType = workstation.getType() != null ? workstation.getType().toString() : "DESKTOP";
                    recommendations.add(RecommendationResponse.WorkstationRecommendation.builder()
                            .workstationId(workstationId)
                            .workstationName(workstation.getName())
                            .workstationType(wsType)
                            .roomName(workstation.getRoom().getName())
                            .floor(workstation.getRoom().getFloor())
                            .suggestedStartTime(suggestedStart)
                            .suggestedEndTime(suggestedStart.plusHours(request.getPreferredDuration() != null ? request.getPreferredDuration() : 2))
                            .duration(request.getPreferredDuration() != null ? request.getPreferredDuration() : 2)
                            .score(recNode.path("score").asDouble())
                            .reason(recNode.path("reason").asText())
                            .advantages(parseAdvantages(recNode.path("advantages")))
                            .specifications(workstation.getSpecifications())
                            .isOptimalTime(true)
                            .build());
                }
            }
            
            return RecommendationResponse.builder()
                    .recommendations(recommendations)
                    .reasoning(jsonResponse.path("reasoning").asText())
                    .confidenceScore(jsonResponse.path("confidenceScore").asDouble())
                    .aiSuggestion("AI-powered recommendation based on your booking history and current context")
                    .build();
            
        } catch (Exception e) {
            log.error("Error parsing AI response", e);
            return generateFallbackRecommendations(request);
        }
    }

    // Helper methods for user profile analysis
    private Map<String, Integer> analyzeWorkstationTypeUsage(List<Reservation> reservations) {
        Map<String, Long> tempMap = reservations.stream()
                .collect(Collectors.groupingBy(
                        r -> {
                            WorkStationType type = r.getWorkStation().getType();
                            return type != null ? type.toString() : "DESKTOP";
                        },
                        Collectors.counting()
                ));
        
        return tempMap.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> Math.toIntExact(entry.getValue())
                ));
    }

    private List<Integer> analyzePreferredDays(List<Reservation> reservations) {
        Map<Integer, Long> dayCount = reservations.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getStartTime().getDayOfWeek().getValue(),
                        Collectors.counting()
                ));
        
        return dayCount.entrySet().stream()
                .sorted(Map.Entry.<Integer, Long>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private LocalTime analyzePreferredStartTime(List<Reservation> reservations) {
        OptionalDouble avgHour = reservations.stream()
                .mapToInt(r -> r.getStartTime().getHour())
                .average();
        
        if (avgHour.isPresent()) {
            return LocalTime.of((int) avgHour.getAsDouble(), 0);
        }
        return LocalTime.of(9, 0); // Default to 9 AM
    }

    private Double calculateAverageDuration(List<Reservation> reservations) {
        return reservations.stream()
                .mapToLong(r -> Duration.between(r.getStartTime(), r.getEndTime()).toHours())
                .average()
                .orElse(2.0);
    }

    private UserBookingProfile createNewUserProfile(Long userId) {
        return UserBookingProfile.builder()
                .userId(userId)
                .totalBookings(0)
                .averageDuration(2.0)
                .preferredStartTime(LocalTime.of(9, 0))
                .preferredDaysOfWeek(Arrays.asList(1, 2, 3, 4, 5)) // Weekdays
                .preferredTimeSlot("morning")
                .mostUsedWorkstationType("DESKTOP")
                .workstationTypeUsage(new HashMap<>())
                .punctualityScore(85.0)
                .cancellationRate(5.0)
                .averageAdvanceBooking(1)
                .prefersQuietSpaces(true)
                .activityPattern("new_user")
                .recentBookingsCount(0)
                .recentTrend("stable")
                .build();
    }

    // Additional helper methods...
    private String getMostUsedType(Map<String, Integer> usage) {
        return usage.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("DESKTOP");
    }

    private String determinePreferredTimeSlot(LocalTime time) {
        int hour = time.getHour();
        if (hour < 12) return "morning";
        if (hour < 17) return "afternoon";
        return "evening";
    }

    private Double calculatePunctualityScore(List<Reservation> reservations) {
        // Simplified calculation - in real implementation, you'd track actual check-ins
        return 85.0 + Math.random() * 10; // Random score between 85-95
    }

    private Double calculateCancellationRate(List<Reservation> reservations) {
        long cancelled = reservations.stream()
                .mapToLong(r -> r.getStatus() == ReservationStatus.CANCELLED ? 1 : 0)
                .sum();
        return reservations.isEmpty() ? 0.0 : (cancelled * 100.0 / reservations.size());
    }

    private Integer calculateAverageAdvanceBooking(List<Reservation> reservations) {
        return (int) reservations.stream()
                .mapToLong(r -> Duration.between(r.getCreatedAt(), r.getStartTime()).toDays())
                .average()
                .orElse(1.0);
    }

    private Boolean inferQuietPreference(List<Reservation> reservations) {
        // This would analyze room types, floor preferences, etc.
        // Simplified implementation
        return true;
    }

    private String determineActivityPattern(List<Reservation> reservations) {
        if (reservations.size() < 5) return "new_user";
        // Analyze booking frequency patterns
        return "consistent";
    }

    private Integer countRecentBookings(List<Reservation> reservations) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        return (int) reservations.stream()
                .filter(r -> r.getCreatedAt().isAfter(thirtyDaysAgo))
                .count();
    }

    private String analyzeRecentTrend(List<Reservation> reservations) {
        // Simplified trend analysis
        return "stable";
    }

    private LocalDateTime calculateSuggestedStartTime(String timeString, LocalDate date) {
        try {
            LocalTime time = LocalTime.parse(timeString);
            return LocalDateTime.of(date != null ? date : LocalDate.now(), time);
        } catch (Exception e) {
            return LocalDateTime.of(date != null ? date : LocalDate.now(), LocalTime.of(9, 0));
        }
    }

    private List<String> parseAdvantages(JsonNode advantagesNode) {
        List<String> advantages = new ArrayList<>();
        if (advantagesNode.isArray()) {
            for (JsonNode advantage : advantagesNode) {
                advantages.add(advantage.asText());
            }
        }
        return advantages;
    }

    private RecommendationResponse generateFallbackRecommendations(RecommendationRequest request) {
        log.info("Generating fallback recommendations for user: {}", request.getUserId());
        
        List<WorkStation> availableWorkstations = getAvailableWorkstations(request);
        List<RecommendationResponse.WorkstationRecommendation> recommendations = new ArrayList<>();
        
        // Simple rule-based fallback
        for (int i = 0; i < Math.min(3, availableWorkstations.size()); i++) {
            WorkStation ws = availableWorkstations.get(i);
            LocalDateTime startTime = LocalDateTime.of(
                    request.getPreferredDate() != null ? request.getPreferredDate() : LocalDate.now(),
                    request.getPreferredStartTime() != null ? request.getPreferredStartTime() : LocalTime.of(9, 0)
            );
            
            String wsType = ws.getType() != null ? ws.getType().toString() : "DESKTOP";
            recommendations.add(RecommendationResponse.WorkstationRecommendation.builder()
                    .workstationId(ws.getId())
                    .workstationName(ws.getName())
                    .workstationType(wsType)
                    .roomName(ws.getRoom().getName())
                    .floor(ws.getRoom().getFloor())
                    .suggestedStartTime(startTime)
                    .suggestedEndTime(startTime.plusHours(request.getPreferredDuration() != null ? request.getPreferredDuration() : 2))
                    .duration(request.getPreferredDuration() != null ? request.getPreferredDuration() : 2)
                    .score(85.0 - (i * 5))
                    .reason("Available workstation matching your criteria")
                    .advantages(Arrays.asList("Available", "Good specifications"))
                    .specifications(ws.getSpecifications())
                    .isOptimalTime(true)
                    .build());
        }
        
        return RecommendationResponse.builder()
                .recommendations(recommendations)
                .reasoning("Basic recommendations based on availability and user preferences")
                .confidenceScore(0.7)
                .aiSuggestion("Rule-based recommendation (AI temporarily unavailable)")
                .build();
    }
} 