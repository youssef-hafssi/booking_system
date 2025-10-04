package com.web4jobs.bookingsystem.mapper;

import com.web4jobs.bookingsystem.dto.center.CenterRequest;
import com.web4jobs.bookingsystem.dto.center.CenterResponse;
import com.web4jobs.bookingsystem.model.Center;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting between Center entities and DTOs.
 */
@Component
public class CenterMapper {

    /**
     * Convert a CenterRequest DTO to a Center entity.
     *
     * @param centerRequest The CenterRequest DTO
     * @return The Center entity
     */
    public Center toCenter(CenterRequest centerRequest) {
        if (centerRequest == null) {
            return null;
        }
        
        Center center = new Center();
        center.setName(centerRequest.getName());
        center.setAddress(centerRequest.getAddress());
        center.setCity(centerRequest.getCity());
        center.setPostalCode(centerRequest.getPostalCode());
        center.setPhoneNumber(centerRequest.getPhoneNumber());
        center.setEmail(centerRequest.getEmail());
        
        return center;
    }

    /**
     * Convert a Center entity to a CenterResponse DTO.
     *
     * @param center The Center entity
     * @return The CenterResponse DTO
     */
    public CenterResponse toCenterResponse(Center center) {
        if (center == null) {
            return null;
        }
        
        CenterResponse response = new CenterResponse();
        response.setId(center.getId());
        response.setName(center.getName());
        response.setAddress(center.getAddress());
        response.setCity(center.getCity());
        response.setPostalCode(center.getPostalCode());
        response.setPhoneNumber(center.getPhoneNumber());
        response.setEmail(center.getEmail());
        response.setCreatedAt(center.getCreatedAt());
        response.setUpdatedAt(center.getUpdatedAt());
        
        // Calculate room count if rooms are loaded
        if (center.getRooms() != null) {
            response.setRoomCount(center.getRooms().size());
            
            // Calculate workstation count
            int workStationCount = center.getRooms().stream()
                    .filter(room -> room.getWorkStations() != null)
                    .mapToInt(room -> room.getWorkStations().size())
                    .sum();
            response.setWorkStationCount(workStationCount);
        } else {
            response.setRoomCount(0);
            response.setWorkStationCount(0);
        }
        
        return response;
    }
}