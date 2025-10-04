package com.web4jobs.bookingsystem.controller;

import com.web4jobs.bookingsystem.dto.maintenance.MaintenanceRequest;
import com.web4jobs.bookingsystem.dto.maintenance.MaintenanceResponse;
import com.web4jobs.bookingsystem.model.Maintenance;
import com.web4jobs.bookingsystem.service.MaintenanceService;
import com.web4jobs.bookingsystem.mapper.MaintenanceMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/maintenances")
public class MaintenanceController {
    private final MaintenanceService maintenanceService;
    private final MaintenanceMapper maintenanceMapper;

    @Autowired
    public MaintenanceController(MaintenanceService maintenanceService, MaintenanceMapper maintenanceMapper) {
        this.maintenanceService = maintenanceService;
        this.maintenanceMapper = maintenanceMapper;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MaintenanceResponse> createMaintenance(
            @Valid @RequestBody MaintenanceRequest request) {
        Maintenance maintenance = maintenanceMapper.toMaintenance(request);
        Maintenance createdMaintenance = maintenanceService.createMaintenance(maintenance);
        MaintenanceResponse response = maintenanceMapper.toMaintenanceResponse(createdMaintenance);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<MaintenanceResponse>> getActiveMaintenances() {
        List<Maintenance> maintenances = maintenanceService.getActiveMaintenances();
        List<MaintenanceResponse> responses = maintenances.stream()
                .map(maintenanceMapper::toMaintenanceResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/center/{centerId}")
    public ResponseEntity<List<MaintenanceResponse>> getCenterMaintenances(
            @PathVariable Long centerId) {
        List<Maintenance> maintenances = maintenanceService.getActiveCenterMaintenances(centerId);
        List<MaintenanceResponse> responses = maintenances.stream()
                .map(maintenanceMapper::toMaintenanceResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMaintenance(@PathVariable Long id) {
        maintenanceService.deleteMaintenance(id);
        return ResponseEntity.noContent().build();
    }
} 