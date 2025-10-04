package com.web4jobs.bookingsystem.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

/**
 * Filter to validate JWT tokens in requests.
 * Extracts token from Authorization header, validates it, and establishes security context.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String requestPath = request.getRequestURI();
        logger.debug("Processing request for path: {}", requestPath);

        try {
            // Extract Authorization header
            final String authHeader = request.getHeader("Authorization");

            // Skip if no Authorization header or not a Bearer token
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                logger.debug("No valid Authorization header found, skipping JWT validation for: {}", requestPath);
                filterChain.doFilter(request, response);
                return;
            }

            // Extract the token
            final String jwt = authHeader.substring(7);
            logger.debug("JWT token found in request");

            // Skip if security context already established
            if (SecurityContextHolder.getContext().getAuthentication() != null) {
                logger.debug("Security context already populated, skipping JWT validation");
                filterChain.doFilter(request, response);
                return;
            }

            // Validate token
            if (jwtUtils.validateToken(jwt)) {
                // Extract user information from token
                String email = jwtUtils.extractEmail(jwt);
                String role = jwtUtils.extractClaim(jwt, claims -> claims.get("role", String.class));
                
                logger.debug("Valid JWT token for user: {}, role: {}", email, role);

                // Set up Spring Security context
                List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + role));

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        email, null, authorities);

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                
                logger.debug("Authentication successful, security context updated for user: {}", email);
            } else {
                logger.warn("Invalid JWT token received");
            }
        } catch (Exception e) {
            logger.error("Could not set user authentication in security context", e);
        }

        filterChain.doFilter(request, response);
    }
} 