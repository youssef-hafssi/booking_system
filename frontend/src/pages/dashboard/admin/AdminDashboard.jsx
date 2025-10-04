import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import InteractiveHoverButton from '../../../components/ui/InteractiveHoverButton';
import MaintenanceAlert from '../../../components/MaintenanceAlert';
import EmailTest from '../../../components/EmailTest';

// Icon 
import { HiOutlineUserGroup, HiOutlineOfficeBuilding, HiOutlineDesktopComputer } from 'react-icons/hi';
import { MdOutlineSchedule, MdOutlineMeetingRoom } from 'react-icons/md';
import { BsBarChartLine } from 'react-icons/bs';

// Import MagicUI components
import { BentoCard, BentoGrid, AnimatedBentoCard } from '../../../components/ui/bento-grid';

const API_URL = 'http://localhost:8080/api';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [workstationCount, setWorkstationCount] = useState(0);
  const [activeReservations, setActiveReservations] = useState(0);
  const [totalReservations, setTotalReservations] = useState(0);
  const [centerCount, setCenterCount] = useState(0);
  const [roomCount, setRoomCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          usersResponse,
          workstationsResponse,
          reservationsResponse,
          centersResponse,
          roomsResponse,
          activityResponse
        ] = await Promise.all([
          user.role === 'CENTER_MANAGER' 
            ? axios.get(`${API_URL}/users/center/${user.centerId}/count`, { headers: { Authorization: `Bearer ${token}` } })
            : axios.get(`${API_URL}/users/count`, { headers: { Authorization: `Bearer ${token}` } }),
          user.role === 'CENTER_MANAGER'
            ? axios.get(`${API_URL}/workstations/center/${user.centerId}/count`, { headers: { Authorization: `Bearer ${token}` } })
            : axios.get(`${API_URL}/workstations/count`, { headers: { Authorization: `Bearer ${token}` } }),
          user.role === 'CENTER_MANAGER'
            ? axios.get(`${API_URL}/reservations/center/${user.centerId}/stats`, { headers: { Authorization: `Bearer ${token}` } })
            : axios.get(`${API_URL}/reservations/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/centers/count`, { headers: { Authorization: `Bearer ${token}` } }),
          user.role === 'CENTER_MANAGER'
            ? axios.get(`${API_URL}/rooms/center/${user.centerId}/count`, { headers: { Authorization: `Bearer ${token}` } })
            : axios.get(`${API_URL}/rooms/count`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/activity/recent`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setUserCount(usersResponse.data);
        setWorkstationCount(workstationsResponse.data);
        setActiveReservations(reservationsResponse.data.active);
        setTotalReservations(reservationsResponse.data.total);
        setCenterCount(centersResponse.data);
        setRoomCount(roomsResponse.data);
        setRecentActivity(activityResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  // Define the features for the bento grid
  const features = [
    {
      Icon: HiOutlineUserGroup,
      name: "Users",
      description: user.role === 'CENTER_MANAGER' 
        ? `${userCount} students in your center`
        : `${userCount} total users`,
      href: "/dashboard/admin/users",
      cta: user.role === 'CENTER_MANAGER' ? "View Students" : "View Users",
      className: "col-span-3 lg:col-span-1 transition-all hover:scale-[1.01]",
      background: (
        <div className="absolute top-5 right-5 p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
          <HiOutlineUserGroup className="h-8 w-8" />
        </div>
      ),
    },
    {
      Icon: HiOutlineDesktopComputer,
      name: "Workstations",
      description: user.role === 'CENTER_MANAGER'
        ? `${workstationCount} workstations in your center`
        : `${workstationCount} total workstations`,
      href: "/dashboard/admin/workstations",
      cta: user.role === 'CENTER_MANAGER' ? "Manage Center Workstations" : "Manage Workstations",
      className: "col-span-3 lg:col-span-1 transition-all hover:scale-[1.01]",
      background: (
        <div className="absolute top-5 right-5 p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
          <HiOutlineDesktopComputer className="h-8 w-8" />
        </div>
      ),
    },
    {
      Icon: MdOutlineSchedule,
      name: "Reservations",
      description: `${activeReservations} active out of ${totalReservations} total`,
      href: "/dashboard/admin/reservations",
      cta: "Manage Reservations",
      className: "col-span-3 lg:col-span-1 transition-all hover:scale-[1.01]",
      background: (
        <div className="absolute top-5 right-5 p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
          <MdOutlineSchedule className="h-8 w-8" />
        </div>
      ),
    },
    ...(user?.role !== 'CENTER_MANAGER' ? [
      {
        Icon: HiOutlineOfficeBuilding,
        name: "Centers",
        description: `${centerCount} centers available`,
        href: "/dashboard/admin/centers",
        cta: "Manage Centers",
        className: "col-span-3 lg:col-span-1 transition-all hover:scale-[1.01]",
        background: (
          <div className="absolute top-5 right-5 p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300">
            <HiOutlineOfficeBuilding className="h-8 w-8" />
          </div>
        ),
      }
    ] : []),
    {
      Icon: MdOutlineMeetingRoom,
      name: "Rooms",
      description: user.role === 'CENTER_MANAGER'
        ? `${roomCount} rooms in your center`
        : `${roomCount} total rooms`,
      href: "/dashboard/admin/rooms",
      cta: user.role === 'CENTER_MANAGER' ? "Manage Center Rooms" : "Manage Rooms",
      className: "col-span-3 lg:col-span-1 transition-all hover:scale-[1.01]",
      background: (
        <div className="absolute top-5 right-5 p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
          <MdOutlineMeetingRoom className="h-8 w-8" />
        </div>
      ),
    },
    {
      Icon: BsBarChartLine,
      name: "Reservation Analytics",
      description: "User reservations & center comparison charts",
      href: "/dashboard/admin/reservation-analytics",
      cta: "View Analytics",
      className: "col-span-3 lg:col-span-1 transition-all hover:scale-[1.01]",
      background: (
        <div className="absolute top-5 right-5 p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
          <BsBarChartLine className="h-8 w-8" />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h2>
        <InteractiveHoverButton
          onClick={() => {}}
          variant="primary"
          size="sm"
        >
          Refresh Data
        </InteractiveHoverButton>
      </div>

      {/* Add MaintenanceAlert component */}
      <MaintenanceAlert />

      {/* Bento Grid Stats */}
      <div className="mb-8">
        <BentoGrid>
          {features.map((feature, idx) => (
            <AnimatedBentoCard key={idx} {...feature} />
          ))}
        </BentoGrid>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-dark-sidebar rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h3>
        
        {recentActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Resource
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {recentActivity.map((activity, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {activity.user || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {activity.action || 'Unknown Action'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {activity.resource || 'Unknown Resource'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown Time'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <p>No recent activity to display</p>
          </div>
        )}
      </div>

      {/* Email Test Section */}
      {user?.role === 'ADMIN' && (
        <div className="mt-8">
          <EmailTest />
        </div>
      )}

      {/* System Status Section */}
      <div className="mt-8 bg-white dark:bg-dark-sidebar rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">System Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
              <p className="text-green-800 dark:text-green-300 font-medium">API Services: Online</p>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">All API services are operating normally.</p>
          </div>
          
          <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
              <p className="text-green-800 dark:text-green-300 font-medium">Database: Connected</p>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Database connection is stable.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 