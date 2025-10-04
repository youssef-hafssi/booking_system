import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import MaintenanceAlert from '../../../components/MaintenanceAlert';
import { Link } from 'react-router-dom';
import InteractiveHoverButton from '../../../components/ui/InteractiveHoverButton';

const ManagerDashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Center Manager Dashboard - {user?.assignedCenter?.name}
        </h2>
      </div>

      {/* Maintenance Alerts */}
      <MaintenanceAlert />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-4">
            <Link to="/dashboard/manager/users">
              <InteractiveHoverButton variant="primary" className="w-full">
                View Center Students
              </InteractiveHoverButton>
            </Link>
            <Link to="/dashboard/manager/workstations">
              <InteractiveHoverButton variant="secondary" className="w-full">
                Manage Workstations
              </InteractiveHoverButton>
            </Link>
            <Link to="/dashboard/manager/reservations">
              <InteractiveHoverButton variant="accent" className="w-full">
                View Reservations
              </InteractiveHoverButton>
            </Link>
            <Link to="/dashboard/manager/maintenances">
              <InteractiveHoverButton variant="warning" className="w-full">
                Manage Maintenances
              </InteractiveHoverButton>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Center Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Students</span>
              <span className="font-semibold text-gray-900 dark:text-white">Loading...</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Active Workstations</span>
              <span className="font-semibold text-gray-900 dark:text-white">Loading...</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Today's Reservations</span>
              <span className="font-semibold text-gray-900 dark:text-white">Loading...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400 italic">No recent activity to display.</p>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard; 