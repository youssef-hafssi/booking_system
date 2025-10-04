package com.web4jobs.bookingsystem.service;

import com.web4jobs.bookingsystem.model.Center;
import com.web4jobs.bookingsystem.model.User;
import com.web4jobs.bookingsystem.model.UserRole;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
 * Service for managing access control based on user roles.
 * Provides methods to determine if a user has access to specific resources.
 */
@Service
public class AccessControlService {
    
    /**
     * Determines if a user has global access to all centers.
     * 
     * @param user The user to check
     * @return true if the user has global access, false otherwise
     */
    public boolean hasGlobalAccess(User user) {
        return user.getRole() == UserRole.ADMIN ||
               user.getRole() == UserRole.EXECUTIVE_DIRECTOR ||
               user.getRole() == UserRole.PEDAGOGICAL_MANAGER ||
               user.getRole() == UserRole.ASSET_MANAGER;
    }
    
    /**
     * Determines if a user can access a specific center.
     * 
     * @param user The user to check
     * @param center The center to check access for
     * @return true if the user can access the center, false otherwise
     */
    public boolean canAccessCenter(User user, Center center) {
        // Global access roles
        if (hasGlobalAccess(user)) {
            return true;
        }
        
        // Restricted access roles
        if (user.getRole() == UserRole.CENTER_MANAGER ||
            user.getRole() == UserRole.STUDENT) {
            return user.getAssignedCenter() != null && 
                   user.getAssignedCenter().getId().equals(center.getId());
        }
        
        return false;
    }
    
    /**
     * Gets the list of centers a user can access.
     * 
     * @param user The user to check
     * @param centerService The center service to use for retrieving centers
     * @return List of centers the user can access
     */
    public List<Center> getAccessibleCenters(User user, CenterService centerService) {
        if (hasGlobalAccess(user)) {
            return centerService.findAllCenters();
        } else if (user.getAssignedCenter() != null) {
            return Collections.singletonList(user.getAssignedCenter());
        } else {
            return Collections.emptyList();
        }
    }
}