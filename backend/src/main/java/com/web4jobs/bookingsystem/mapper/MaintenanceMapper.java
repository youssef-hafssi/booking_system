package com.web4jobs.bookingsystem.mapper;

import com.web4jobs.bookingsystem.dto.maintenance.MaintenanceRequest;
import com.web4jobs.bookingsystem.dto.maintenance.MaintenanceResponse;
import com.web4jobs.bookingsystem.model.Maintenance;
import com.web4jobs.bookingsystem.service.CenterService;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.hibernate.Hibernate;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Component
public class MaintenanceMapper {
    private final CenterService centerService;
    
    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    public MaintenanceMapper(CenterService centerService) {
        this.centerService = centerService;
    }

    public Maintenance toMaintenance(MaintenanceRequest request) {
        Maintenance maintenance = new Maintenance();
        maintenance.setTitle(request.getTitle());
        maintenance.setDescription(request.getDescription());
        maintenance.setStartDate(request.getStartDate());
        maintenance.setEndDate(request.getEndDate());
        maintenance.setActive(true); // Ensure new maintenances are active
        
        // Only set center if centerId is not null and greater than 0
        if (request.getCenterId() != null && request.getCenterId() > 0) {
            maintenance.setCenter(centerService.findCenterById(request.getCenterId())
                .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + request.getCenterId())));
        }
        
        return maintenance;
    }

    public MaintenanceResponse toMaintenanceResponse(Maintenance maintenance) {
        MaintenanceResponse response = new MaintenanceResponse();
        response.setId(maintenance.getId());
        response.setTitle(maintenance.getTitle());
        response.setDescription(maintenance.getDescription());
        response.setStartDate(maintenance.getStartDate());
        response.setEndDate(maintenance.getEndDate());
        response.setActive(maintenance.isActive());
        response.setCreatedAt(maintenance.getCreatedAt());
        response.setUpdatedAt(maintenance.getUpdatedAt());
        
        // Handle center data
        if (maintenance.getCenter() != null) {
            // Since we're using FETCH in our queries, the center should be initialized
            response.setCenterId(maintenance.getCenter().getId());
            response.setCenterName(maintenance.getCenter().getName());
        }
        
        return response;
    }
} 