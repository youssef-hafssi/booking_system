package com.web4jobs.bookingsystem.config;

import com.theokanning.openai.service.OpenAiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Configuration for OpenAI service integration
 * Used for AI-powered smart booking suggestions
 */
@Configuration
public class OpenAIConfig {

    @Value("${openai.api.key}")
    private String openAiKey;

    @Bean
    public OpenAiService openAiService() {
        return new OpenAiService(openAiKey, Duration.ofSeconds(30));
    }
} 