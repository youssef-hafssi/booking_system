import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { maintenanceService } from '../services/api';

const MaintenanceAlert = () => {
  const { user } = useAuth();
  const [maintenances, setMaintenances] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMaintenances = async () => {
      try {
        // Debug log for user info
        console.log('MaintenanceAlert - Current user:', {
          role: user?.role,
          centerId: user?.assignedCenter?.id || user?.centerId,
          centerName: user?.assignedCenter?.name || user?.center?.name,
          email: user?.email,
          fullUser: user // Log the full user object to see its structure
        });

        let response;
        const centerId = user?.assignedCenter?.id || user?.centerId;
        
        // Use different endpoints based on user role and center assignment
        if (centerId) {
          console.log('MaintenanceAlert - Fetching maintenances for center:', centerId);
          // For users with assigned center (students, center managers), get center maintenances
          response = await maintenanceService.getCenterMaintenances(centerId);
        } else if (['ADMIN', 'EXECUTIVE_DIRECTOR', 'ASSET_MANAGER'].includes(user?.role)) {
          console.log('MaintenanceAlert - Fetching all maintenances for admin role');
          // For admin roles, get all maintenances
          response = await maintenanceService.getAllMaintenances();
        } else {
          // For users without assigned center, don't show any maintenances
          console.log('MaintenanceAlert - No maintenances for user without assigned center');
          setMaintenances([]);
          return;
        }

        if (!response?.data) {
          console.error('MaintenanceAlert - No data in response:', response);
          setError('Invalid response format from server');
          return;
        }

        console.log('MaintenanceAlert - Raw maintenance data:', response.data);

        // Filter only active maintenances
        const activeMaintenances = response.data.filter(m => {
          const isActive = m.active === true || m.active === 'true';
          const now = new Date();
          const endDate = new Date(m.endDate);
          const isNotEnded = endDate > now;
          
          console.log('MaintenanceAlert - Maintenance:', {
            id: m.id,
            title: m.title,
            centerId: m.centerId,
            centerName: m.centerName,
            active: isActive,
            endDate: endDate,
            isNotEnded: isNotEnded,
            fullMaintenance: m // Log the full maintenance object
          });
          
          return isActive && isNotEnded;
        });

        console.log('MaintenanceAlert - Filtered maintenances:', activeMaintenances);
        setMaintenances(activeMaintenances);
      } catch (error) {
        console.error('MaintenanceAlert - Error fetching maintenances:', error);
        if (error.response) {
          console.error('MaintenanceAlert - Error response:', {
            status: error.response.status,
            data: error.response.data,
            fullError: error // Log the full error object
          });
        }
        setError('Failed to load maintenance alerts');
      }
    };

    if (user) {
      console.log('MaintenanceAlert - Initiating maintenance fetch for user:', user);
      fetchMaintenances();
    }

    const interval = setInterval(() => {
      if (user) {
        fetchMaintenances();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  if (!user || maintenances.length === 0) {
    console.log('MaintenanceAlert - No maintenances to display:', {
      hasUser: !!user,
      maintenanceCount: maintenances.length,
      userRole: user?.role,
      centerName: user?.assignedCenter?.name || user?.center?.name,
      fullUser: user // Log the full user object
    });
    return null;
  }

  if (error) {
    return (
      <div className="mb-6">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 overflow-hidden">
        <div className="bg-yellow-100 dark:bg-yellow-900/40 px-4 py-2 border-b border-yellow-200 dark:border-yellow-800">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">
            Active Maintenance Alerts
          </h3>
        </div>
        <div className="p-4 space-y-4">
          {maintenances.map(maintenance => (
            <div key={maintenance.id} className="border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-base font-medium text-yellow-800 dark:text-yellow-300">
                    {maintenance.title}
                  </h4>
                  <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-200">
                    <p>{maintenance.description}</p>
                    <p className="mt-2 text-xs font-medium">
                      From: {new Date(maintenance.startDate).toLocaleString()}
                      <br />
                      To: {new Date(maintenance.endDate).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceAlert; 