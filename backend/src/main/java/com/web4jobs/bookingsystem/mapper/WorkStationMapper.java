package com.web4jobs.bookingsystem.mapper;

import com.web4jobs.bookingsystem.dto.room.RoomSummaryResponse;
import com.web4jobs.bookingsystem.dto.workstation.WorkStationRequest;
import com.web4jobs.bookingsystem.dto.workstation.WorkStationResponse;
import com.web4jobs.bookingsystem.model.Room;
import com.web4jobs.bookingsystem.model.WorkStation;
import com.web4jobs.bookingsystem.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Mapper for converting between WorkStation entities and DTOs.
 */
@Component
public class WorkStationMapper {

    private final RoomRepository roomRepository;

    @Autowired
    public WorkStationMapper(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    /**
     * Convert a WorkStationRequest DTO to a WorkStation entity.
     *
     * @param request The WorkStationRequest DTO
     * @return The WorkStation entity
     */
    public WorkStation toWorkStation(WorkStationRequest request) {
        if (request == null) {
            return null;
        }

        WorkStation workStation = new WorkStation();
        workStation.setName(request.getName());
        workStation.setDescription(request.getDescription());
        workStation.setSpecifications(request.getSpecifications());
        workStation.setStatus(request.getStatus());
        workStation.setPosition(request.getPosition());
        workStation.setImageUrl(request.getImageUrl());

        // Set the room if roomId is provided
        if (request.getRoomId() != null) {
            Room room = new Room();
            room.setId(request.getRoomId());
            workStation.setRoom(room);
        }

        return workStation;
    }

    /**
     * Convert a WorkStation entity to a WorkStationResponse DTO.
     *
     * @param workStation The WorkStation entity
     * @return The WorkStationResponse DTO
     */
    public WorkStationResponse toWorkStationResponse(WorkStation workStation) {
        if (workStation == null) {
            return null;
        }

        WorkStationResponse response = new WorkStationResponse();
        response.setId(workStation.getId());
        response.setName(workStation.getName());
        response.setDescription(workStation.getDescription());
        response.setSpecifications(workStation.getSpecifications());
        response.setStatus(workStation.getStatus());
        response.setPosition(workStation.getPosition());
        response.setImageUrl(workStation.getImageUrl());
        response.setCreatedAt(workStation.getCreatedAt());
        response.setUpdatedAt(workStation.getUpdatedAt());

        // Set room information if available
        if (workStation.getRoom() != null) {
            Room room = workStation.getRoom();
            RoomSummaryResponse roomSummary = new RoomSummaryResponse();
            roomSummary.setId(room.getId());
            roomSummary.setName(room.getName());
            roomSummary.setFloor(room.getFloor());
            
            // Set center information if available - ensuring we always include centerId and centerName
            if (room.getCenter() != null) {
                roomSummary.setCenterId(room.getCenter().getId());
                roomSummary.setCenterName(room.getCenter().getName());
            } else {
                // Log a warning if center information is missing
                System.out.println("WARNING: Center information missing for room with ID: " + room.getId());
                
                // If the room has a center_id field but the center object is null due to lazy loading,
                // we could try to load it manually here or leave placeholder values
                roomSummary.setCenterId(null);
                roomSummary.setCenterName("Unknown Center");
            }
            
            response.setRoom(roomSummary);
        }

        // Calculate if the workstation is currently available
        // This is a simplified check - in a real application, you would check against current reservations
        response.setCurrentlyAvailable(workStation.getStatus() == com.web4jobs.bookingsystem.model.WorkStationStatus.AVAILABLE);

        return response;
    }
}