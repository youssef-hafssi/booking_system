import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8080/api';

// MagicUI Components
const MagicCard = ({ className, children }) => {
  const cardRef = useRef(null);
  const [mouseX, setMouseX] = useState(-200);
  const [mouseY, setMouseY] = useState(-200);

  const handleMouseMove = (e) => {
    if (cardRef.current) {
      const { left, top } = cardRef.current.getBoundingClientRect();
      setMouseX(e.clientX - left);
      setMouseY(e.clientY - top);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`relative rounded-xl ${className}`}
      onMouseMove={handleMouseMove}
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-border opacity-0 duration-300 group-hover:opacity-100"
           style={{
             background: `radial-gradient(200px circle at ${mouseX}px ${mouseY}px, rgba(154, 120, 255, 0.4), rgba(255, 123, 123, 0.1), transparent 100%)`,
           }}
      />
      <div className="absolute inset-px rounded-xl bg-background" />
      <div className="pointer-events-none absolute inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
           style={{
             background: `radial-gradient(200px circle at ${mouseX}px ${mouseY}px, rgba(120, 120, 120, 0.1), transparent 100%)`,
             opacity: 0.8,
           }}
      />
      <div className="relative">{children}</div>
    </div>
  );
};

const BlurModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-md rounded-lg p-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-shine">
        <div className="bg-white dark:bg-dark-sidebar rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const ShimmerButton = ({ onClick, className, children }) => {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 overflow-visible">
        <div className="absolute h-[100%] w-auto -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      </div>
    </button>
  );
};

const BorderBeam = ({ className }) => {
  return (
    <div className={`pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)] ${className}`}>
      <div
        className="absolute aspect-square bg-gradient-to-l from-purple-500 via-pink-400 to-transparent"
        style={{
          width: '50px',
          offsetPath: 'rect(0 auto auto 0 round 50px)',
          animation: 'moveAlong 6s linear infinite',
        }}
      />
    </div>
  );
};

const CentersManagement = () => {
  const { token, user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [centerToDelete, setCenterToDelete] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Check if user has permission to access this page
  const canAccessCentersManagement = user?.role === 'ADMIN' || 
                                    user?.role === 'EXECUTIVE_DIRECTOR' || 
                                    user?.role === 'ASSET_MANAGER' ||
                                    user?.role === 'PEDAGOGICAL_MANAGER';
  
  // Check if user has permission to create centers
  const canCreateCenter = user?.role === 'ADMIN' || 
                          user?.role === 'EXECUTIVE_DIRECTOR' || 
                          user?.role === 'ASSET_MANAGER';
  
  // Check if user has permission to delete centers
  const canDeleteCenter = canCreateCenter;
  
  // Redirect if user doesn't have access
  useEffect(() => {
    if (user && !canAccessCentersManagement) {
      navigate('/dashboard');
    }
  }, [user, canAccessCentersManagement, navigate]);
  
  // Form state
  const [formMode, setFormMode] = useState('create');
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    phoneNumber: '',
    email: ''
  });
  
  // Load centers on component mount
  useEffect(() => {
    fetchCenters();
  }, []);
  
  const fetchCenters = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/centers`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCenters(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch centers: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      postalCode: '',
      phoneNumber: '',
      email: ''
    });
    setFormMode('create');
    setSelectedCenter(null);
    setIsEditModalOpen(false);
  };
  
  const handleEditCenter = (center) => {
    setSelectedCenter(center);
    setFormData({
      name: center.name,
      address: center.address,
      city: center.city,
      postalCode: center.postalCode,
      phoneNumber: center.phoneNumber || '',
      email: center.email || ''
    });
    setFormMode('edit');
    setIsEditModalOpen(true);
  };
  
  const handleOpenDeleteModal = (center) => {
    setCenterToDelete(center);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setCenterToDelete(null);
    setIsDeleteModalOpen(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (formMode === 'create') {
        // Create new center
        await axios.post(`${API_URL}/centers`, formData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // Update existing center
        await axios.put(`${API_URL}/centers/${selectedCenter.id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      // Refresh centers
      fetchCenters();
      // Reset form
      resetForm();
      setError(null);
    } catch (err) {
      setError(`Failed to ${formMode} center: ` + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };
  
  const handleDeleteCenter = async () => {
    if (!centerToDelete) return;
    
    try {
      await axios.delete(`${API_URL}/centers/${centerToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh centers
      fetchCenters();
      setError(null);
      handleCloseDeleteModal();
    } catch (err) {
      setError('Failed to delete center: ' + (err.response?.data?.message || err.message));
      console.error(err);
      handleCloseDeleteModal();
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Centers Management</h1>
        {canCreateCenter && (
          <ShimmerButton 
            onClick={() => setFormMode('create')}
            className="btn btn-primary relative overflow-hidden transition-all duration-300 hover:shadow-md"
          >
            Create New Center
          </ShimmerButton>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Center Form */}
      {formMode === 'create' && canCreateCenter && (
        <MagicCard className="mb-6 group bg-white dark:bg-dark-sidebar p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Create New Center
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Center Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <ShimmerButton
                type="submit"
                className="btn btn-primary"
              >
                Create Center
              </ShimmerButton>
            </div>
          </form>
        </MagicCard>
      )}
      
      {/* Centers List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 dark:border-accent-yellow"></div>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Loading centers...</p>
        </div>
      ) : centers.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No centers found. Create one to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Center Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {centers.map(center => (
                <tr key={center.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-white">{center.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-800 dark:text-gray-200">{center.address}</div>
                    <div className="text-gray-500 dark:text-gray-400">{center.city}, {center.postalCode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-800 dark:text-gray-200">{center.phoneNumber}</div>
                    <div className="text-gray-500 dark:text-gray-400">{center.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleEditCenter(center)}
                      className="relative overflow-hidden text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3 px-3 py-1 rounded"
                    >
                      <span className="relative z-10">Edit</span>
                      <BorderBeam className="opacity-0 hover:opacity-100" />
                    </button>
                    {canDeleteCenter && (
                      <button 
                        onClick={() => handleOpenDeleteModal(center)}
                        className="relative overflow-hidden text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 px-3 py-1 rounded"
                      >
                        <span className="relative z-10">Delete</span>
                        <BorderBeam className="opacity-0 hover:opacity-100" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Edit Modal */}
      <BlurModal
        isOpen={isEditModalOpen}
        onClose={resetForm}
        title="Edit Center"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Center Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input w-full"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="form-input w-full"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="form-input w-full"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input w-full"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <ShimmerButton
              type="submit"
              className="btn btn-primary"
            >
              Update Center
            </ShimmerButton>
          </div>
        </form>
      </BlurModal>
      
      {/* Delete Confirmation Modal */}
      <BlurModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete {centerToDelete?.name}? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCloseDeleteModal}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <ShimmerButton
              onClick={handleDeleteCenter}
              className="btn btn-danger bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </ShimmerButton>
          </div>
        </div>
      </BlurModal>
      
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes moveAlong {
          0% {
            offset-distance: 0%;
          }
          100% {
            offset-distance: 100%;
          }
        }
        
        .animate-shine {
          background-size: 300% 300%;
          animation: shine 4s ease infinite;
        }
        
        @keyframes shine {
          0% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          100% {
            background-position: 0% 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default CentersManagement; 