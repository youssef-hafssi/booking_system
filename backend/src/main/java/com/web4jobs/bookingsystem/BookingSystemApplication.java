package com.web4jobs.bookingsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication(exclude = {SecurityAutoConfiguration.class})
@EnableScheduling
public class BookingSystemApplication {

	public static void main(String[] args) {
		// Set default timezone for the entire application before starting Spring
		TimeZone.setDefault(TimeZone.getTimeZone("Africa/Casablanca"));
		
		SpringApplication.run(BookingSystemApplication.class, args);
	}

}