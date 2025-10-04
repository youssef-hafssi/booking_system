package com.web4jobs.bookingsystem.repository;

import com.web4jobs.bookingsystem.model.Center;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for managing Center entities.
 * Provides methods for CRUD operations and custom queries related to centers.
 */
@Repository
public interface CenterRepository extends JpaRepository<Center, Long> {
    
    /**
     * Find all centers in a specific city.
     * 
     * @param city The city to filter by
     * @return A list of centers in the specified city
     */
    List<Center> findByCity(String city);
    
    /**
     * Find all centers in a specific postal code area.
     * 
     * @param postalCode The postal code to filter by
     * @return A list of centers in the specified postal code area
     */
    List<Center> findByPostalCode(String postalCode);
    
    /**
     * Find all centers by name containing the search term (case insensitive).
     * 
     * @param searchTerm The search term to look for in center names
     * @return A list of matching centers
     */
    List<Center> findByNameContainingIgnoreCase(String searchTerm);
    
    /**
     * Find all centers by city containing the search term (case insensitive).
     * 
     * @param searchTerm The search term to look for in city names
     * @return A list of matching centers
     */
    List<Center> findByCityContainingIgnoreCase(String searchTerm);
    
    /**
     * Find all centers by address containing the search term (case insensitive).
     * 
     * @param searchTerm The search term to look for in addresses
     * @return A list of matching centers
     */
    List<Center> findByAddressContainingIgnoreCase(String searchTerm);
    
    /**
     * Find all centers with available workstations.
     * This query checks for centers that have at least one room with at least one available workstation.
     * 
     * @return A list of centers with available workstations
     */
    @Query("SELECT DISTINCT c FROM Center c JOIN c.rooms r JOIN r.workStations ws WHERE ws.status = 'AVAILABLE'")
    List<Center> findCentersWithAvailableWorkStations();
    
    /**
     * Find all centers in a specific city with available workstations.
     * 
     * @param city The city to filter by
     * @return A list of centers in the specified city with available workstations
     */
    @Query("SELECT DISTINCT c FROM Center c JOIN c.rooms r JOIN r.workStations ws WHERE c.city = ?1 AND ws.status = 'AVAILABLE'")
    List<Center> findCentersInCityWithAvailableWorkStations(String city);
}