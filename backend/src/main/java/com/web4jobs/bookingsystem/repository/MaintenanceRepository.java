package com.web4jobs.bookingsystem.repository;

import com.web4jobs.bookingsystem.model.Maintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {
    @Query("SELECT DISTINCT m FROM Maintenance m " +
           "INNER JOIN FETCH m.center " +
           "WHERE m.active = true")
    List<Maintenance> findByIsActiveTrue();
    
    @Query("SELECT DISTINCT m FROM Maintenance m " +
           "INNER JOIN FETCH m.center c " +
           "WHERE m.active = true " +
           "AND c.id = :centerId")
    List<Maintenance> findByCenterIdAndIsActiveTrue(@Param("centerId") Long centerId);
    
    @Query("SELECT m FROM Maintenance m WHERE m.active = true AND " +
           "((m.startDate <= ?1 AND m.endDate >= ?1) OR " +
           "(m.startDate <= ?2 AND m.endDate >= ?2) OR " +
           "(m.startDate >= ?1 AND m.endDate <= ?2))")
    List<Maintenance> findOverlappingMaintenances(LocalDateTime start, LocalDateTime end);
} 