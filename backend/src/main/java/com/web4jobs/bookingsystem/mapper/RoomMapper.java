package com.web4jobs.bookingsystem.mapper;

import com.web4jobs.bookingsystem.dto.center.CenterSummaryResponse;
import com.web4jobs.bookingsystem.dto.room.RoomRequest;
import com.web4jobs.bookingsystem.dto.room.RoomResponse;
import com.web4jobs.bookingsystem.model.Center;
import com.web4jobs.bookingsystem.model.Room;
import com.web4jobs.bookingsystem.model.WorkStation;
import com.web4jobs.bookingsystem.model.WorkStationStatus;
import com.web4jobs.bookingsystem.repository.CenterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

/**
 * Mapper for converting between Room entities and DTOs.
 */
@Component
public class RoomMapper {

    private final CenterRepository centerRepository;

    @Autowired
    public RoomMapper(CenterRepository centerRepository) {
        this.centerRepository = centerRepository;
    }

    /**
     * Convert a RoomRequest DTO to a Room entity.
     *
     * @param roomRequest The RoomRequest DTO
     * @return The Room entity
     */
    public Room toRoom(RoomRequest roomRequest) {
        Room room = new Room();
        room.setName(roomRequest.getName());
        room.setFloor(roomRequest.getFloor());
        room.setCapacity(roomRequest.getCapacity());
        
        // Set center if centerId is provided
        if (roomRequest.getCenterId() != null) {
            Center center = new Center();
            center.setId(roomRequest.getCenterId());
            room.setCenter(center);
        }
        
        return room;
    }

    /**
     * Convert a Room entity to a RoomResponse DTO.
     *
     * @param room The Room entity
     * @return The RoomResponse DTO
     */
    public RoomResponse toRoomResponse(Room room) {
        RoomResponse roomResponse = new RoomResponse();
        roomResponse.setId(room.getId());
        roomResponse.setName(room.getName());
        roomResponse.setFloor(room.getFloor());
        roomResponse.setCapacity(room.getCapacity());
        roomResponse.setCreatedAt(room.getCreatedAt());
        roomResponse.setUpdatedAt(room.getUpdatedAt());
        
        // Set center information
        if (room.getCenter() != null) {
            CenterSummaryResponse centerSummary = new CenterSummaryResponse();
            centerSummary.setId(room.getCenter().getId());
            centerSummary.setName(room.getCenter().getName());
            centerSummary.setLocation(room.getCenter().getAddress() + ", " + room.getCenter().getCity());
            centerSummary.setContactInfo(room.getCenter().getPhoneNumber());
            roomResponse.setCenter(centerSummary);
        }
        
        // Calculate workstation counts if workstations are loaded
        if (room.getWorkStations() != null) {
            roomResponse.setWorkStationCount(room.getWorkStations().size());
            
            // Count available workstations
            int availableCount = (int) room.getWorkStations().stream()
                    .filter(ws -> ws.getStatus() == WorkStationStatus.AVAILABLE)
                    .count();
            roomResponse.setAvailableWorkStationCount(availableCount);
        } else {
            roomResponse.setWorkStationCount(0);
            roomResponse.setAvailableWorkStationCount(0);
        }
        
        return roomResponse;
    }
}