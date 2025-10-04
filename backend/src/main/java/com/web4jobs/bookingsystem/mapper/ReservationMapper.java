package com.web4jobs.bookingsystem.mapper;

import com.web4jobs.bookingsystem.dto.reservation.ReservationRequest;
import com.web4jobs.bookingsystem.dto.reservation.ReservationResponse;
import com.web4jobs.bookingsystem.dto.user.UserSummaryResponse;
import com.web4jobs.bookingsystem.dto.workstation.WorkStationSummaryResponse;
import com.web4jobs.bookingsystem.model.Reservation;
import com.web4jobs.bookingsystem.model.ReservationStatus;
import com.web4jobs.bookingsystem.model.User;
import com.web4jobs.bookingsystem.model.WorkStation;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Mapper for converting between Reservation entities and DTOs.
 */
@Component
public class ReservationMapper {

    /**
     * Convert a ReservationRequest DTO to a Reservation entity.
     *
     * @param request The ReservationRequest DTO
     * @return The Reservation entity
     */
    public Reservation toReservation(ReservationRequest request) {
        if (request == null) {
            return null;
        }

        Reservation reservation = new Reservation();
        
        // Set user reference
        User user = new User();
        user.setId(request.getUserId());
        reservation.setUser(user);
        
        // Set workstation reference
        WorkStation workStation = new WorkStation();
        workStation.setId(request.getWorkStationId());
        reservation.setWorkStation(workStation);
        
        // Set other fields
        reservation.setStartTime(request.getStartTime());
        reservation.setEndTime(request.getEndTime());
        reservation.setStatus(request.getStatus());
        reservation.setNotes(request.getNotes());
        
        return reservation;
    }

    /**
     * Convert a Reservation entity to a ReservationResponse DTO.
     *
     * @param reservation The Reservation entity
     * @return The ReservationResponse DTO
     */
    public ReservationResponse toReservationResponse(Reservation reservation) {
        if (reservation == null) {
            return null;
        }

        ReservationResponse response = new ReservationResponse();
        response.setId(reservation.getId());
        
        // Set user information
        if (reservation.getUser() != null) {
            User user = reservation.getUser();
            UserSummaryResponse userSummary = new UserSummaryResponse();
            userSummary.setId(user.getId());
            userSummary.setFirstName(user.getFirstName());
            userSummary.setLastName(user.getLastName());
            userSummary.setEmail(user.getEmail());
            userSummary.setRole(user.getRole());
            response.setUser(userSummary);
        }
        
        // Set workstation information
        if (reservation.getWorkStation() != null) {
            WorkStation workStation = reservation.getWorkStation();
            WorkStationSummaryResponse workStationSummary = new WorkStationSummaryResponse();
            workStationSummary.setId(workStation.getId());
            workStationSummary.setName(workStation.getName());
            workStationSummary.setStatus(workStation.getStatus());
            
            // Set room and center information if available
            if (workStation.getRoom() != null) {
                workStationSummary.setRoomId(workStation.getRoom().getId());
                workStationSummary.setRoomName(workStation.getRoom().getName());
                
                if (workStation.getRoom().getCenter() != null) {
                    workStationSummary.setCenterId(workStation.getRoom().getCenter().getId());
                    workStationSummary.setCenterName(workStation.getRoom().getCenter().getName());
                }
            }
            
            response.setWorkStation(workStationSummary);
        }
        
        // Set other fields
        response.setStartTime(reservation.getStartTime());
        response.setEndTime(reservation.getEndTime());
        response.setStatus(reservation.getStatus());
        response.setNotes(reservation.getNotes());
        response.setCancellationReason(reservation.getCancellationReason());
        response.setCancelledAt(reservation.getCancelledAt());
        response.setCreatedAt(reservation.getCreatedAt());
        response.setUpdatedAt(reservation.getUpdatedAt());
        
        // Set cancelled by user information
        if (reservation.getCancelledBy() != null) {
            User cancelledByUser = reservation.getCancelledBy();
            UserSummaryResponse cancelledBySummary = new UserSummaryResponse();
            cancelledBySummary.setId(cancelledByUser.getId());
            cancelledBySummary.setFirstName(cancelledByUser.getFirstName());
            cancelledBySummary.setLastName(cancelledByUser.getLastName());
            cancelledBySummary.setEmail(cancelledByUser.getEmail());
            cancelledBySummary.setRole(cancelledByUser.getRole());
            response.setCancelledBy(cancelledBySummary);
        }
        
        // Calculate if the reservation can be cancelled
        // A reservation can be cancelled if it's in PENDING or CONFIRMED status and hasn't started yet
        boolean canCancel = (reservation.getStatus() == ReservationStatus.PENDING || 
                            reservation.getStatus() == ReservationStatus.CONFIRMED) &&
                            reservation.getStartTime().isAfter(LocalDateTime.now());
        response.setCanCancel(canCancel);
        
        return response;
    }
}