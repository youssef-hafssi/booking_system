import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { maintenanceService, centerService } from '../../../services/api';
import DatePicker from '../../../components/ui/date-picker';
import TimePicker from '../../../components/ui/time-picker';
import { useNavigate } from 'react-router-dom';

export default function MaintenanceManagement() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [maintenances, setMaintenances] = useState([]);
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        centerId: user?.role === 'CENTER_MANAGER' ? user?.assignedCenter?.id : ''
    });

    // Redirect if not authorized
    useEffect(() => {
        if (user?.role !== 'ADMIN' && user?.role !== 'CENTER_MANAGER') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Fetch maintenances and centers on component mount
    useEffect(() => {
        fetchMaintenances();
        if (user?.role === 'ADMIN') {
            fetchCenters();
        }
    }, [user]);

    const fetchMaintenances = async () => {
        try {
            const response = user?.role === 'CENTER_MANAGER' && user?.assignedCenter?.id
                ? await maintenanceService.getCenterMaintenances(user.assignedCenter.id)
                : await maintenanceService.getAllMaintenances();
            setMaintenances(response.data);
        } catch (err) {
            setError('Failed to fetch maintenances');
            console.error('Error fetching maintenances:', err);
        }
    };

    const fetchCenters = async () => {
        try {
            const response = await centerService.getAllCenters();
            setCenters(response.data);
        } catch (err) {
            console.error('Error fetching centers:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (type) => (date) => {
        if (!date) return;
        
        // When changing date, preserve the time from the existing value
        const existingTime = formData[type] ? new Date(formData[type]) : new Date();
        const newDate = new Date(date);
        newDate.setHours(existingTime.getHours());
        newDate.setMinutes(existingTime.getMinutes());
        
        setFormData(prev => ({
            ...prev,
            [type]: newDate.toISOString()
        }));
    };

    const handleTimeChange = (type) => (time) => {
        if (!time) return;
        
        // When changing time, preserve the date from the existing value or use selected date
        const existingDate = formData[type] ? new Date(formData[type]) : new Date();
        const newDate = new Date(existingDate);
        newDate.setHours(time.getHours());
        newDate.setMinutes(time.getMinutes());
        
        setFormData(prev => ({
            ...prev,
            [type]: newDate.toISOString()
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validate required fields
        if (!formData.title?.trim()) {
            setError('Title is required');
            setLoading(false);
            return;
        }

        if (!formData.startDate || !formData.endDate) {
            setError('Both start and end dates are required');
            setLoading(false);
            return;
        }

        // Validate center selection for admin
        if (user?.role === 'ADMIN' && (!formData.centerId || Number(formData.centerId) <= 0)) {
            setError('Please select a center for the maintenance');
            setLoading(false);
            return;
        }

        // Validate dates are in the future
        const now = new Date();
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);

        if (startDate <= now) {
            setError('Start date must be in the future');
            setLoading(false);
            return;
        }

        if (endDate <= now) {
            setError('End date must be in the future');
            setLoading(false);
            return;
        }

        if (endDate <= startDate) {
            setError('End date must be after start date');
            setLoading(false);
            return;
        }

        try {
            // Always use a valid centerId
            const maintenanceData = {
                ...formData,
                centerId: user?.role === 'CENTER_MANAGER' 
                    ? user.assignedCenter.id 
                    : Number(formData.centerId)
            };

            await maintenanceService.createMaintenance(maintenanceData);
            setFormData({
                title: '',
                description: '',
                startDate: '',
                endDate: '',
                centerId: user?.role === 'CENTER_MANAGER' ? user?.assignedCenter?.id : ''
            });
            fetchMaintenances(); // Refresh the list
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create maintenance');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this maintenance?')) {
            return;
        }

        try {
            await maintenanceService.deleteMaintenance(id);
            fetchMaintenances(); // Refresh the list
        } catch (err) {
            setError('Failed to delete maintenance');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {user?.role === 'CENTER_MANAGER' ? 'Center Maintenance Management' : 'Maintenance Management'}
            </h2>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    {error}
                </div>
            )}

            {/* Create Maintenance Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Schedule New Maintenance
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Title
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows="3"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Start Date
                                </label>
                                <DatePicker
                                    value={formData.startDate ? new Date(formData.startDate) : null}
                                    onChange={handleDateChange('startDate')}
                                    placeholder="Select start date..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Start Time
                                </label>
                                <TimePicker
                                    value={formData.startDate ? new Date(formData.startDate) : null}
                                    onChange={handleTimeChange('startDate')}
                                    placeholder="Select start time..."
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    End Date
                                </label>
                                <DatePicker
                                    value={formData.endDate ? new Date(formData.endDate) : null}
                                    onChange={handleDateChange('endDate')}
                                    placeholder="Select end date..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    End Time
                                </label>
                                <TimePicker
                                    value={formData.endDate ? new Date(formData.endDate) : null}
                                    onChange={handleTimeChange('endDate')}
                                    placeholder="Select end time..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Center Selection - Only show for admin */}
                    {user?.role === 'ADMIN' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Center (Required)
                            </label>
                            <select
                                name="centerId"
                                value={formData.centerId}
                                onChange={handleInputChange}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="">Select a center</option>
                                {centers.map(center => (
                                    <option key={center.id} value={center.id}>
                                        {center.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {loading ? 'Scheduling...' : 'Schedule Maintenance'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Maintenances List */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {user?.role === 'CENTER_MANAGER' 
                            ? `Maintenance Schedule for ${user?.assignedCenter?.name}`
                            : 'All Maintenance Schedules'
                        }
                    </h3>
                </div>
                
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Center
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Start Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                End Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {maintenances.map(maintenance => (
                            <tr key={maintenance.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                    {maintenance.title}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                    {maintenance.centerName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                    {new Date(maintenance.startDate).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                    {new Date(maintenance.endDate).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        maintenance.active
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                    }`}>
                                        {maintenance.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <button
                                        onClick={() => handleDelete(maintenance.id)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 