import React from 'react';
import MaintenanceAlert from '../MaintenanceAlert';

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                <MaintenanceAlert />
                {children}
            </div>
        </div>
    );
} 