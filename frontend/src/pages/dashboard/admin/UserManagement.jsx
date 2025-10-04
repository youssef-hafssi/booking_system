import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import InteractiveHoverButton from '../../../components/ui/InteractiveHoverButton';

const API_URL = 'http://localhost:8080/api';

const UserManagement = () => {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Form state for creating/editing users
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT',
    phoneNumber: '',
    assignedCenter: null
  });
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  
  // State for centers (needed for center assignment dropdown)
  const [centers, setCenters] = useState([]);
  
  // Get all users on component mount
  useEffect(() => {
    fetchUsers();
    fetchCenters();
  }, [page, size]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users?page=${page}&size=${size}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Handle pagination response structure from backend
      if (response.data && response.data.content) {
        setUsers(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      } else {
        // Fallback if not paginated
        setUsers(response.data || []);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch users: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCenters = async () => {
    try {
      const response = await axios.get(`${API_URL}/centers`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Handle pagination or array response
      if (response.data && response.data.content) {
        setCenters(response.data.content);
      } else {
        setCenters(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch centers:', err);
    }
  };
  
  // Check if the selected role is a managerial role that might need all centers
  const isManagerialRole = (role) => {
    return ['PEDAGOGICAL_MANAGER', 'ASSET_MANAGER', 'EXECUTIVE_DIRECTOR'].includes(role);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'centerId') {
      // Special handling for center selection
      if (value === 'all') {
        // Special case for "All Centers" option
        setFormData({
          ...formData,
          assignedCenter: { id: 'all', name: 'All Centers' }
        });
      } else {
        const selectedCenter = value ? centers.find(center => center.id.toString() === value) : null;
        setFormData({
          ...formData,
          assignedCenter: selectedCenter
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear validation error for this field when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'STUDENT',
      phoneNumber: '',
      assignedCenter: null
    });
    setFormErrors({});
    setFormMode('create');
    setSelectedUser(null);
  };
  
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '', // Don't include password in edit form
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phoneNumber: user.phoneNumber || '',
      assignedCenter: user.assignedCenter
    });
    setFormErrors({});
    setFormMode('edit');
  };
  
  const validateForm = () => {
    const errors = {};
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Password validation (only required for new users)
    if (formMode === 'create' && !formData.password) {
      errors.password = 'Password is required for new users';
    }
    
    // First name validation
    if (!formData.firstName) {
      errors.firstName = 'First name is required';
    }
    
    // Last name validation
    if (!formData.lastName) {
      errors.lastName = 'Last name is required';
    }
    
    // Center validation for manager roles - allow "All Centers" option for certain roles
    const managerRoles = ['CENTER_MANAGER', 'PEDAGOGICAL_MANAGER', 'ASSET_MANAGER', 'EXECUTIVE_DIRECTOR'];
    if (managerRoles.includes(formData.role) && 
        !formData.assignedCenter && 
        !(isManagerialRole(formData.role) && formData.assignedCenter?.id === 'all')) {
      errors.centerId = `${formatRole(formData.role)} must be assigned to a center`;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const prepareRequestData = () => {
    const requestData = { ...formData };
    
    // Format for backend request
    if (!requestData.password) {
      delete requestData.password;
    }
    
    // Handle assignedCenter based on the User entity structure in backend
    if (requestData.assignedCenter) {
      // Handle the "All Centers" special case
      if (requestData.assignedCenter.id === 'all') {
        // For backend, null might be used to indicate "all centers" for certain roles
        // This depends on your backend implementation
        requestData.centerId = null;
        requestData.allCenters = true; // Add a flag to indicate all centers
      } else {
        // Ensure the centerId is a number, not a string
        requestData.centerId = Number(requestData.assignedCenter.id);
      }
    } else {
      // For manager roles, we need to ensure a center is assigned
      const managerRoles = ['CENTER_MANAGER', 'PEDAGOGICAL_MANAGER', 'ASSET_MANAGER', 'EXECUTIVE_DIRECTOR'];
      if (managerRoles.includes(requestData.role) && !requestData.centerId) {
        throw new Error(`${formatRole(requestData.role)} must be assigned to a center`);
      }
      requestData.centerId = null;
    }
    
    // Remove assignedCenter from request data since backend expects centerId
    delete requestData.assignedCenter;
    
    return requestData;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const requestData = prepareRequestData();
      
      // Log the request data for debugging
      console.log('Sending user data:', requestData);
      
      if (formMode === 'create') {
        // Create new user
        const response = await axios.post(`${API_URL}/users`, requestData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('User creation successful:', response.data);
      } else {
        // Update existing user
        const response = await axios.put(`${API_URL}/users/${selectedUser.id}`, requestData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('User update successful:', response.data);
      }
      
      // Refresh user list
      fetchUsers();
      // Reset form
      resetForm();
      setError(null);
    } catch (err) {
      console.error('API Error Details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers,
        config: err.config
      });
      
      if (err.response?.data?.message) {
        setError(`Failed to ${formMode} user: ${err.response.data.message}`);
      } else if (err.response?.data) {
        // Handle validation errors from the backend
        const validationErrors = {};
        Object.entries(err.response.data).forEach(([key, value]) => {
          validationErrors[key] = value;
        });
        setFormErrors(validationErrors);
        setError(`Failed to ${formMode} user: Please check the form for errors`);
      } else {
        setError(`Failed to ${formMode} user: ${err.message}`);
      }
    }
  };
  
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`${API_URL}/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Refresh user list
        fetchUsers();
        setError(null);
      } catch (err) {
        setError('Failed to delete user: ' + (err.response?.data?.message || err.message));
        console.error(err);
      }
    }
  };
  
  // Helper to format role for display
  const formatRole = (role) => {
    return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // Pagination handlers
  const handlePreviousPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };
  
  const handleNextPage = () => {
    if (page < totalPages - 1) {
      setPage(page + 1);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <InteractiveHoverButton 
          onClick={() => {
            resetForm();
            setFormMode('create');
          }}
          variant="accent"
        >
          Create New User
        </InteractiveHoverButton>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {/* User Form */}
      {formMode !== 'view' && (
        <div className="mb-6 bg-white dark:bg-dark-sidebar p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {formMode === 'create' ? 'Create New User' : 'Edit User'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-input w-full rounded-md border ${
                    formErrors.email ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                  required
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">
                  {formMode === 'create' ? 'Password' : 'Password (leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`form-input w-full rounded-md border ${
                    formErrors.password ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                  required={formMode === 'create'}
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.password}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`form-input w-full rounded-md border ${
                    formErrors.firstName ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                  required
                />
                {formErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`form-input w-full rounded-md border ${
                    formErrors.lastName ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                  required
                />
                {formErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.lastName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="form-select w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="STUDENT">Student</option>
                  <option value="CENTER_MANAGER">Center Manager</option>
                  <option value="PEDAGOGICAL_MANAGER">Pedagogical Manager</option>
                  <option value="ASSET_MANAGER">Asset Manager</option>
                  <option value="EXECUTIVE_DIRECTOR">Executive Director</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {['CENTER_MANAGER', 'PEDAGOGICAL_MANAGER', 'ASSET_MANAGER', 'EXECUTIVE_DIRECTOR'].includes(formData.role) && (
                  <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                    Note: {formatRole(formData.role)} must be assigned to a center
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="form-input w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Center</label>
                <select
                  name="centerId"
                  value={formData.assignedCenter?.id || ""}
                  onChange={handleInputChange}
                  className={`form-select w-full rounded-md border ${
                    formErrors.centerId ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                >
                  <option value="">No Center Assignment</option>
                  {/* Add "All Centers" option for managerial roles */}
                  {isManagerialRole(formData.role) && (
                    <option value="all">All Centers (For Managers)</option>
                  )}
                  {centers.map(center => (
                    <option key={center.id} value={center.id}>
                      {center.name}
                    </option>
                  ))}
                </select>
                {formErrors.centerId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.centerId}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <InteractiveHoverButton
                type="button"
                onClick={resetForm}
                variant="primary"
              >
                Cancel
              </InteractiveHoverButton>
              <InteractiveHoverButton
                type="submit"
                variant="accent"
              >
                {formMode === 'create' ? 'Create User' : 'Update User'}
              </InteractiveHoverButton>
            </div>
          </form>
        </div>
      )}
      
      {/* Users List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 dark:border-accent-yellow"></div>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Loading users...</p>
        </div>
      ) : (
        users.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-2xl">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-dark-sidebar">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Center
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-white">{user.firstName} {user.lastName}</div>
                        {user.phoneNumber && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.phoneNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {formatRole(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {user.assignedCenter ? (
                          user.assignedCenter.name
                        ) : (
                          <span className="text-gray-500 dark:text-gray-500">Not Assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Page {page + 1} of {totalPages}
                  {totalElements > 0 && ` (${totalElements} total users)`}
                </div>
                <div className="flex space-x-2">
                  <InteractiveHoverButton
                    onClick={handlePreviousPage}
                    disabled={page === 0}
                    variant="primary"
                    size="sm"
                    className={page === 0 ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    Previous
                  </InteractiveHoverButton>
                  <InteractiveHoverButton
                    onClick={handleNextPage}
                    disabled={page >= totalPages - 1}
                    variant="primary"
                    size="sm"
                    className={page >= totalPages - 1 ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    Next
                  </InteractiveHoverButton>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No users found. Create your first user by clicking the button above.</p>
          </div>
        )
      )}
    </div>
  );
};

export default UserManagement; 