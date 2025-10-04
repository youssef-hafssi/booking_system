import React, { useState, useEffect } from 'react';
import { penaltyService } from '../../../services/api';
import Button from '../../../components/ui/button';
import Modal from '../../../components/ui/modal';

const PenaltyManagement = () => {
  const [stats, setStats] = useState(null);
  const [badUsers, setBadUsers] = useState([]);
  const [warningUsers, setWarningUsers] = useState([]);
  const [topOffenders, setTopOffenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleAddStrike = async (userId) => {
    if (!reason.trim()) {
      setError('Please provide a reason for adding the strike');
      return;
    }

    try {
      setActionLoading(true);
      await penaltyService.addManualStrike(userId, reason);
      setSuccess('Strike added successfully');
      setReason('');
      setShowUserModal(false);
      setSelectedUser(null);
      await fetchPenaltyData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add strike');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchPenaltyData();
  }, []);

  const fetchPenaltyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsResponse, badUsersResponse, warningUsersResponse, topOffendersResponse] = await Promise.all([
        penaltyService.getOverallStats(),
        penaltyService.getBadUsers(),
        penaltyService.getWarningUsers(),
        penaltyService.getTopOffenders(10)
      ]);

      setStats(statsResponse.data);
      setBadUsers(badUsersResponse.data);
      setWarningUsers(warningUsersResponse.data);
      setTopOffenders(topOffendersResponse.data);
    } catch (err) {
      console.error('Error fetching penalty data:', err);
      setError('Failed to load penalty data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNoShow = async (reservationId) => {
    if (!window.confirm('Are you sure you want to mark this reservation as no-show? This will add a strike to the user.')) {
      return;
    }

    try {
      setActionLoading(true);
      await penaltyService.markReservationAsNoShow(reservationId);
      setSuccess('Reservation marked as no-show and penalty applied');
      fetchPenaltyData();
    } catch (err) {
      console.error('Error marking no-show:', err);
      setError(err.response?.data?.message || 'Failed to mark as no-show');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveStrike = async (userId) => {
    if (!window.confirm('Are you sure you want to remove a strike from this user?')) {
      return;
    }

    try {
      setActionLoading(true);
      await penaltyService.removeStrike(userId);
      setSuccess('Strike removed successfully');
      fetchPenaltyData();
    } catch (err) {
      console.error('Error removing strike:', err);
      setError(err.response?.data?.message || 'Failed to remove strike');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetStrikes = async (userId) => {
    if (!window.confirm('Are you sure you want to reset ALL strikes for this user?')) {
      return;
    }

    try {
      setActionLoading(true);
      await penaltyService.resetStrikes(userId);
      setSuccess('All strikes reset successfully');
      fetchPenaltyData();
    } catch (err) {
      console.error('Error resetting strikes:', err);
      setError(err.response?.data?.message || 'Failed to reset strikes');
    } finally {
      setActionLoading(false);
    }
  };

  const showUserDetails = async (user) => {
    try {
      const statsResponse = await penaltyService.getUserPenaltyStats(user.id);
      setSelectedUser({ ...user, stats: statsResponse.data });
      setShowUserModal(true);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError('Failed to load user details');
    }
  };

  const getStatusBadge = (status, strikeCount) => {
    if (status === 'BAD') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Bad User ({strikeCount} strikes)
        </span>
      );
    } else if (status === 'WARNING') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Warning ({strikeCount} strikes)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Good ({strikeCount} strikes)
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-accent-yellow"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Penalty Management</h2>
        <Button onClick={fetchPenaltyData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-300">{success}</p>
        </div>
      )}

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Bad Users</h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats?.badUsersCount || 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Users with 5+ strikes</p>
        </div>
        
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Warning Users</h3>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats?.warningUsersCount || 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Users with 3-4 strikes</p>
        </div>
        
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Total No-Shows</h3>
          <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">
            {topOffenders.reduce((sum, user) => sum + (user.totalNoShows || 0), 0)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">All time no-shows</p>
        </div>
      </div>

      {/* Bad Users */}
      {badUsers.length > 0 && (
        <div className="bg-white dark:bg-dark-card rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Bad Users (Cannot Make Reservations)</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {badUsers.map(user => (
              <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <div className="ml-4">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => showUserDetails(user)}>
                      Details
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => { setSelectedUser(user); setShowUserModal(true); }}>
                      Add Strike
                    </Button>
                  </div>
                    {getStatusBadge(user.userStatus, user.strikeCount)}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => showUserDetails(user)}>
                    Details
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => { setSelectedUser(user); setShowUserModal(true); }}>
                    Add Strike
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRemoveStrike(user.id)} disabled={actionLoading}>
                    Remove Strike
                  </Button>
                  <Button size="sm" color="green" onClick={() => handleResetStrikes(user.id)} disabled={actionLoading}>
                    Reset All
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Users */}
      {warningUsers.length > 0 && (
        <div className="bg-white dark:bg-dark-card rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Warning Users</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {warningUsers.map(user => (
              <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(user.userStatus, user.strikeCount)}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => showUserDetails(user)}>
                    Details
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => { setSelectedUser(user); setShowUserModal(true); }}>
                    Add Strike
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRemoveStrike(user.id)} disabled={actionLoading}>
                    Remove Strike
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Offenders */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Top No-Show Offenders</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {topOffenders.map((user, index) => (
            <div key={user.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                  {index + 1}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                <div className="ml-4">
                  {getStatusBadge(user.userStatus, user.strikeCount)}
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.totalNoShows || 0} no-shows
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => showUserDetails(user)}>
                  Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Details Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
          setReason('');
          setError('');
          setSuccess('');
        }}
        title="User Penalty Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
              </div>
              {getStatusBadge(selectedUser.userStatus, selectedUser.strikeCount)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Strikes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.strikeCount || 0}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total No-Shows</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.totalNoShows || 0}</p>
              </div>
            </div>

            {selectedUser.stats?.lastStrikeDate && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Strike Date</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(selectedUser.stats.lastStrikeDate).toLocaleDateString()}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Can Make Reservations</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {selectedUser.stats?.canMakeReservations ? 'Yes' : 'No - Too many strikes'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Add New Strike</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Enter reason for adding strike"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <Button
                    onClick={() => handleAddStrike(selectedUser.id)}
                    disabled={actionLoading || !reason.trim()}
                    variant="primary"
                    size="lg"
                  >
                    Add Strike
                  </Button>
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button 
                  onClick={() => handleRemoveStrike(selectedUser.id)} 
                  disabled={actionLoading || selectedUser.strikeCount === 0}
                  variant="outline"
                >
                  Remove Strike
                </Button>
                <Button 
                  onClick={() => handleResetStrikes(selectedUser.id)} 
                  disabled={actionLoading || selectedUser.strikeCount === 0}
                  color="green"
                >
                  Reset All Strikes
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PenaltyManagement;