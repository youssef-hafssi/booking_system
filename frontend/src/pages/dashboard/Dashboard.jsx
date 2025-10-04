import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import MagicNavbar from '../../components/ui/navbar';

// Dashboard sub-pages
import DashboardHome from './DashboardHome';
import UserProfile from './UserProfile';

// Student Workstation pages - new imports
import WorkstationSearch from './student/WorkstationSearch';
// Import WorkstationReservations for roles that can make reservations
import WorkstationReservations from './student/WorkstationReservations';

// Manager pages
import CenterUsers from './manager/CenterUsers';

// Admin pages
import AdminDashboard from './admin/AdminDashboard';
import UserManagement from './admin/UserManagement';
import CentersManagement from './admin/CentersManagement';
import RoomsManagement from './admin/RoomsManagement';
import WorkstationsManagement from './admin/WorkstationsManagement';
import ReservationsManagement from './admin/ReservationsManagement';
import ReservationManagement from './admin/ReservationManagement';
import Analytics from './admin/Analytics';
import EnhancedAnalytics from './admin/EnhancedAnalytics';
import ReservationAnalytics from './admin/ReservationAnalytics';
import MaintenanceManagement from './admin/MaintenanceManagement';
import PenaltyManagement from './admin/PenaltyManagement';

function Dashboard() {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-dark-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-accent-yellow"></div>
      </div>
    );
  }

  // Determine if user is admin or has elevated privileges
  const isAdmin = user?.role === 'ADMIN';
  const hasElevatedPrivileges = ['ADMIN', 'EXECUTIVE_DIRECTOR', 'ASSET_MANAGER', 'CENTER_MANAGER', 'PEDAGOGICAL_MANAGER'].includes(user?.role);
  
  // Define roles that can access centers management
  const canAccessCentersManagement = ['ADMIN', 'EXECUTIVE_DIRECTOR', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER'].includes(user?.role);

  // Show dashboard content once user is authenticated
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-background text-gray-900 dark:text-white">
      {/* Modern navbar */}
      <MagicNavbar 
        hasElevatedPrivileges={hasElevatedPrivileges} 
        isAdmin={isAdmin} 
        canAccessCentersManagement={canAccessCentersManagement} 
      />
      
      {/* Main Content - adjusted padding for fixed navbar */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="flex flex-col gap-6">
          {/* Content Area */}
          <div className="flex-1 bg-white dark:bg-dark-card shadow-lg rounded-2xl p-6 min-h-[calc(100vh-12rem)]">
            <Routes>
              {/* Regular user routes - show AdminDashboard for users with elevated privileges */}
              <Route path="/" element={hasElevatedPrivileges ? <AdminDashboard /> : <DashboardHome />} />
              <Route path="/profile" element={<UserProfile />} />
              
              {/* Student workstation routes - only for non-admin users */}
              <Route 
                path="/workstations" 
                element={
                  hasElevatedPrivileges ? 
                    <Navigate to="/dashboard/admin" replace /> : 
                    <WorkstationSearch />
                } 
              />
              {user?.role !== 'CENTER_MANAGER' && (
                <Route 
                  path="/reservations" 
                  element={
                    hasElevatedPrivileges ? 
                      <Navigate to="/dashboard/admin/reservations" replace /> : 
                      <WorkstationReservations />
                  } 
                />
              )}
              
              {/* Center Manager routes */}
              {user?.role === 'CENTER_MANAGER' && (
                <>
                  <Route path="/manager/users" element={<CenterUsers />} />
                  <Route path="/manager/maintenances" element={<MaintenanceManagement />} />
                </>
              )}
              
              {/* Admin routes */}
              {hasElevatedPrivileges && (
                <>
                  {/* Admin dashboard */}
                  <Route path="/admin" element={<AdminDashboard />} />
                  
                  {isAdmin && (
                    <>
                      <Route path="/admin/users" element={<UserManagement />} />
                      <Route path="/admin/maintenance" element={<MaintenanceManagement />} />
                      <Route path="/admin/penalties" element={<PenaltyManagement />} />
                    </>
                  )}
                  {canAccessCentersManagement && <Route path="/admin/centers" element={<CentersManagement />} />}
                  <Route path="/admin/rooms" element={<RoomsManagement />} />
                  <Route path="/admin/workstations" element={<WorkstationsManagement />} />
                  <Route path="/admin/reservations" element={<ReservationManagement />} />
                  <Route path="/admin/reservations-old" element={<ReservationsManagement />} />
                  <Route path="/admin/analytics" element={<Analytics />} />
                  <Route path="/admin/enhanced-analytics" element={<EnhancedAnalytics />} />
                  <Route path="/admin/reservation-analytics" element={<ReservationAnalytics />} />
                </>
              )}
              
              {/* Fallback for other routes */}
              <Route path="*" element={<div>Page coming soon...</div>} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard; 