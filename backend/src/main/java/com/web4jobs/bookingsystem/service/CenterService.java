package com.web4jobs.bookingsystem.service;

import com.web4jobs.bookingsystem.model.Center;
import com.web4jobs.bookingsystem.model.Room;
import com.web4jobs.bookingsystem.repository.CenterRepository;
import com.web4jobs.bookingsystem.repository.RoomRepository;
import com.web4jobs.bookingsystem.dto.room.RoomResponse;
import com.web4jobs.bookingsystem.mapper.RoomMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing Center entities.
 * Provides business logic for center management operations.
 */
@Service
public class CenterService {

    private final CenterRepository centerRepository;
    private final RoomRepository roomRepository;
    private final RoomMapper roomMapper;

    @Autowired
    public CenterService(CenterRepository centerRepository, RoomRepository roomRepository, RoomMapper roomMapper) {
        this.centerRepository = centerRepository;
        this.roomRepository = roomRepository;
        this.roomMapper = roomMapper;
    }

    /**
     * Find all centers in the system.
     *
     * @return A list of all centers
     */
    public List<Center> findAllCenters() {
        return centerRepository.findAll();
    }

    /**
     * Find a center by its ID.
     *
     * @param id The ID of the center to find
     * @return An Optional containing the center if found, or empty if not found
     */
    public Optional<Center> findCenterById(Long id) {
        return centerRepository.findById(id);
    }

    /**
     * Find all centers in a specific city.
     *
     * @param city The city to filter by
     * @return A list of centers in the specified city
     */
    public List<Center> findCentersByCity(String city) {
        return centerRepository.findByCity(city);
    }

    /**
     * Find all centers in a specific postal code area.
     *
     * @param postalCode The postal code to filter by
     * @return A list of centers in the specified postal code area
     */
    public List<Center> findCentersByPostalCode(String postalCode) {
        return centerRepository.findByPostalCode(postalCode);
    }

    /**
     * Find all centers with available workstations.
     *
     * @return A list of centers with available workstations
     */
    public List<Center> findCentersWithAvailableWorkStations() {
        return centerRepository.findCentersWithAvailableWorkStations();
    }

    /**
     * Find all centers in a specific city with available workstations.
     *
     * @param city The city to filter by
     * @return A list of centers in the specified city with available workstations
     */
    public List<Center> findCentersInCityWithAvailableWorkStations(String city) {
        return centerRepository.findCentersInCityWithAvailableWorkStations(city);
    }

    /**
     * Search for centers by name.
     *
     * @param searchTerm The search term to look for in center names
     * @return A list of matching centers
     */
    public List<Center> searchCentersByName(String searchTerm) {
        return centerRepository.findByNameContainingIgnoreCase(searchTerm);
    }

    /**
     * Search for centers by city.
     *
     * @param searchTerm The search term to look for in city names
     * @return A list of matching centers
     */
    public List<Center> searchCentersByCity(String searchTerm) {
        return centerRepository.findByCityContainingIgnoreCase(searchTerm);
    }

    /**
     * Search for centers by address.
     *
     * @param searchTerm The search term to look for in addresses
     * @return A list of matching centers
     */
    public List<Center> searchCentersByAddress(String searchTerm) {
        return centerRepository.findByAddressContainingIgnoreCase(searchTerm);
    }

    /**
     * Create a new center.
     *
     * @param center The center to create
     * @return The created center with ID assigned
     */
    @Transactional
    public Center createCenter(Center center) {
        // Set creation and update timestamps
        LocalDateTime now = LocalDateTime.now();
        center.setCreatedAt(now);
        center.setUpdatedAt(now);
        
        return centerRepository.save(center);
    }

    /**
     * Update an existing center.
     *
     * @param id The ID of the center to update
     * @param centerDetails The updated center details
     * @return The updated center
     * @throws IllegalArgumentException if the center does not exist
     */
    @Transactional
    public Center updateCenter(Long id, Center centerDetails) {
        Center center = centerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + id));
        
        // Update fields
        center.setName(centerDetails.getName());
        center.setAddress(centerDetails.getAddress());
        center.setCity(centerDetails.getCity());
        center.setPostalCode(centerDetails.getPostalCode());
        center.setPhoneNumber(centerDetails.getPhoneNumber());
        center.setEmail(centerDetails.getEmail());
        
        // Update timestamp
        center.setUpdatedAt(LocalDateTime.now());
        
        return centerRepository.save(center);
    }

    /**
     * Delete a center by its ID.
     *
     * @param id The ID of the center to delete
     * @throws IllegalArgumentException if the center does not exist
     */
    @Transactional
    public void deleteCenter(Long id) {
        if (!centerRepository.existsById(id)) {
            throw new IllegalArgumentException("Center not found with id: " + id);
        }
        centerRepository.deleteById(id);
    }

    /**
     * Count all centers in the system.
     *
     * @return The count of all centers
     */
    public long countCenters() {
        return centerRepository.count();
    }

    /**
     * Find all rooms in a specific center and return as DTOs.
     *
     * @param centerId The ID of the center
     * @return A list of room DTOs in the specified center
     */
    @Transactional(readOnly = true)
    public List<RoomResponse> findRoomsByCenter(Long centerId) {
        List<Room> rooms = roomRepository.findByCenterId(centerId);
        return rooms.stream()
                .map(roomMapper::toRoomResponse)
                .collect(Collectors.toList());
    }
}