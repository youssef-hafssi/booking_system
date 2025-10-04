package com.web4jobs.bookingsystem.service;

import com.web4jobs.bookingsystem.model.Maintenance;
import com.web4jobs.bookingsystem.repository.MaintenanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MaintenanceService {
    private final MaintenanceRepository maintenanceRepository;
    private final CenterService centerService;

    @Autowired
    public MaintenanceService(MaintenanceRepository maintenanceRepository, CenterService centerService) {
        this.maintenanceRepository = maintenanceRepository;
        this.centerService = centerService;
    }

    @Transactional
    public Maintenance createMaintenance(Maintenance maintenance) {
        validateMaintenanceDates(maintenance);
        maintenance.setActive(true); // Ensure new maintenances are active
        return maintenanceRepository.save(maintenance);
    }

    @Transactional(readOnly = true)
    public List<Maintenance> getAllMaintenances() {
        List<Maintenance> maintenances = maintenanceRepository.findAll();
        return filterActiveMaintenances(maintenances);
    }

    @Transactional(readOnly = true)
    public List<Maintenance> getActiveMaintenances() {
        List<Maintenance> maintenances = maintenanceRepository.findByIsActiveTrue();
        return filterActiveMaintenances(maintenances);
    }

    /**
     * Get active maintenances for a specific center.
     * This includes both center-specific maintenances and system-wide maintenances (where center is null).
     *
     * @param centerId The ID of the center
     * @return List of active maintenances for the center and system-wide maintenances
     */
    @Transactional(readOnly = true)
    public List<Maintenance> getActiveCenterMaintenances(Long centerId) {
        List<Maintenance> maintenances = maintenanceRepository.findByCenterIdAndIsActiveTrue(centerId);
        return filterActiveMaintenances(maintenances);
    }

    private List<Maintenance> filterActiveMaintenances(List<Maintenance> maintenances) {
        LocalDateTime now = LocalDateTime.now();
        return maintenances.stream()
            .filter(m -> m.isActive() && 
                        m.getEndDate().isAfter(now)) // Only show future and ongoing maintenances
            .collect(Collectors.toList());
    }

    private void validateMaintenanceDates(Maintenance maintenance) {
        if (maintenance.getEndDate().isBefore(maintenance.getStartDate())) {
            throw new IllegalArgumentException("End date must be after start date");
        }

        List<Maintenance> overlapping = maintenanceRepository.findOverlappingMaintenances(
            maintenance.getStartDate(), 
            maintenance.getEndDate()
        );

        if (!overlapping.isEmpty()) {
            throw new IllegalStateException("Maintenance period overlaps with existing maintenance");
        }
    }

    @Transactional
    public void deleteMaintenance(Long id) {
        Maintenance maintenance = maintenanceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Maintenance not found with id: " + id));
        maintenanceRepository.delete(maintenance);
    }
} 