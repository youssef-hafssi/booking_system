import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import MaintenanceAlert from '../../components/MaintenanceAlert';
import { reservationService } from '../../services/api';

// Import MagicUI components
import { BentoCard, BentoGrid, AnimatedBentoCard } from '../../components/ui/bento-grid';

const DashboardHome = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    activeReservations: 0,
    upcomingReservations: 0,
    pastReservations: 0,
    favoriteWorkstations: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await reservationService.getUserReservationStats(user.id);
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchStats();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  const features = [
    {
      name: "Active Reservations",
      description: `${stats.activeReservations} currently active reservations`,
      href: "/dashboard/reservations",
      cta: "View Active Reservations",
      className: "col-span-3 lg:col-span-1 transition-all hover:scale-[1.01]",
    },
    {
      name: "Upcoming Reservations",
      description: `${stats.upcomingReservations} upcoming reservations`,
      href: "/dashboard/reservations",
      cta: "View Upcoming Reservations",
      className: "col-span-3 lg:col-span-1 transition-all hover:scale-[1.01]",
    },
    {
      name: "Past Reservations",
      description: `${stats.pastReservations} past reservations`,
      href: "/dashboard/reservations",
      cta: "View History",
      className: "col-span-3 lg:col-span-1 transition-all hover:scale-[1.01]",
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user.firstName}!</h2>
      </div>

      {/* Add MaintenanceAlert component */}
      <MaintenanceAlert />

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Bento Grid Stats */}
      <div className="mb-8">
        <BentoGrid>
          {features.map((feature, idx) => (
            <AnimatedBentoCard key={idx} {...feature} />
          ))}
        </BentoGrid>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/dashboard/workstations"
            className="p-4 bg-white dark:bg-dark-card rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h4 className="font-medium text-lg mb-2">Find a Workstation</h4>
            <p className="text-gray-600 dark:text-gray-300">Search and reserve available workstations</p>
          </Link>
          <Link
            to="/dashboard/reservations"
            className="p-4 bg-white dark:bg-dark-card rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h4 className="font-medium text-lg mb-2">Manage Reservations</h4>
            <p className="text-gray-600 dark:text-gray-300">View and manage your workstation reservations</p>
          </Link>
        </div>
      </div>

      {/* Favorite Workstations */}
      {stats.favoriteWorkstations.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Favorite Workstations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.favoriteWorkstations.map((workstation) => (
              <div key={workstation.id} className="p-4 bg-white dark:bg-dark-card rounded-lg shadow">
                <h4 className="font-medium mb-2">{workstation.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{workstation.center}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{workstation.room}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome; 