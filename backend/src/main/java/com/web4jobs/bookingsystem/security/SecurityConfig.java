package com.web4jobs.bookingsystem.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.access.channel.ChannelProcessingFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.access.AccessDeniedHandlerImpl;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;

/**
 * Security configuration for the application.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    /**
     * Configure custom access denied handler to return 404 instead of 403.
     */
    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, ex) -> {
            response.setStatus(HttpStatus.NOT_FOUND.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":404,\"error\":\"Not Found\",\"message\":\"Resource not found\"}");
        };
    }

    /**
     * Configure the security filter chain.
     *
     * @param http The HttpSecurity to configure
     * @return The configured SecurityFilterChain
     * @throws Exception If an error occurs during configuration
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            // .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Disabled default CORS handling
            .addFilterBefore(corsFilter(), ChannelProcessingFilter.class) // Ensure CorsFilter runs early in the chain
            // Use STATELESS for JWT authentication
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .accessDeniedHandler(accessDeniedHandler())
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // Allow preflight OPTIONS requests
                // Public endpoints that don't require authentication
                .requestMatchers("/api/auth/login", "/api/auth/register").permitAll()
                
                // Test endpoints for health checks
                .requestMatchers("/api/test/**").permitAll()
                
                // Analytics endpoints (temporarily allow for testing)
                .requestMatchers("/api/analytics/**").permitAll()
                
                // Centers API need to be accessible for the registration page
                .requestMatchers(HttpMethod.GET, "/api/centers").permitAll()
                
                // TEMPORARILY allow user creation for testing
                .requestMatchers(HttpMethod.POST, "/api/users").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users", "/api/users/**").permitAll()
                
                // Allow access to uploaded files
                .requestMatchers("/uploads/**").permitAll()
                
                // Admin-only endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                
                // User management endpoints - restricted to ADMIN
                .requestMatchers("/api/users/**").hasRole("ADMIN")
                
                // Center management - restricted to specific roles
                .requestMatchers(HttpMethod.GET, "/api/centers/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/centers/**").hasAnyRole("ADMIN", "CENTER_MANAGER", "ASSET_MANAGER", "EXECUTIVE_DIRECTOR", "PEDAGOGICAL_MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/centers/**").hasAnyRole("ADMIN", "ASSET_MANAGER", "EXECUTIVE_DIRECTOR")
                .requestMatchers(HttpMethod.DELETE, "/api/centers/**").hasAnyRole("ADMIN", "ASSET_MANAGER", "EXECUTIVE_DIRECTOR")
                
                // Room management - allow read access to all users
                .requestMatchers(HttpMethod.GET, "/api/rooms/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/rooms/**").hasAnyRole("ADMIN", "CENTER_MANAGER", "ASSET_MANAGER", "EXECUTIVE_DIRECTOR", "PEDAGOGICAL_MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/rooms/**").hasAnyRole("ADMIN", "CENTER_MANAGER", "ASSET_MANAGER", "EXECUTIVE_DIRECTOR", "PEDAGOGICAL_MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/rooms/**").hasAnyRole("ADMIN", "CENTER_MANAGER", "ASSET_MANAGER", "EXECUTIVE_DIRECTOR", "PEDAGOGICAL_MANAGER")
                
                // Workstation management - allow read access to all users
                .requestMatchers(HttpMethod.GET, "/api/workstations/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/workstations/**").hasAnyRole("ADMIN", "ASSET_MANAGER", "EXECUTIVE_DIRECTOR", "PEDAGOGICAL_MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/workstations/**").hasAnyRole("ADMIN", "CENTER_MANAGER", "ASSET_MANAGER", "EXECUTIVE_DIRECTOR", "PEDAGOGICAL_MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/workstations/**").hasAnyRole("ADMIN", "ASSET_MANAGER", "EXECUTIVE_DIRECTOR", "PEDAGOGICAL_MANAGER")
                
                // Reservation management - most users can view, but only some can manage
                .requestMatchers(HttpMethod.GET, "/api/reservations/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/reservations/**").hasAnyRole("ADMIN", "PEDAGOGICAL_MANAGER", "STUDENT")
                .requestMatchers(HttpMethod.PATCH, "/api/reservations/approve/**", "/api/reservations/reject/**")
                    .hasAnyRole("ADMIN", "CENTER_MANAGER", "PEDAGOGICAL_MANAGER")
                .requestMatchers(HttpMethod.PATCH, "/api/reservations/**")
                    .hasAnyRole("ADMIN", "CENTER_MANAGER", "PEDAGOGICAL_MANAGER", "STUDENT")
                .requestMatchers(HttpMethod.DELETE, "/api/reservations/**")
                    .hasAnyRole("ADMIN", "CENTER_MANAGER", "PEDAGOGICAL_MANAGER", "STUDENT")
                
                // All other API endpoints require authentication
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
            )
            // Add JWT authentication filter before the built-in UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
            
        return http.build();
    }

    /**
     * Configure CORS for the application.
     *
     * @return The CORS configuration source
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
        configuration.setExposedHeaders(Arrays.asList("Content-Type"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // Expose CorsFilter as a Bean to ensure it is processed early
    @Bean
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }

    /**
     * Configure the password encoder for the application.
     *
     * @return The password encoder
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}