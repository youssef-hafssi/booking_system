import React from 'react';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Temporarily removed timezone import to fix build issue
// import { logTimezoneInfo } from './utils/timezone';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Context
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  // Log timezone information on app startup
  React.useEffect(() => {
    console.log('🕒 Workstation Booking System - Timezone Configuration');
    console.log('=== Timezone Information ===');
    console.log('App Timezone: Africa/Casablanca');
    console.log('User Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log('============================');
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes - accessible to all authenticated users */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard/*" element={<Dashboard />} />
            </Route>
            
            {/* Redirect /admin to dashboard for backward compatibility */}
            <Route 
              element={
                <ProtectedRoute 
                  allowedRoles={[
                    'ADMIN', 
                    'CENTER_MANAGER', 
                    'ASSET_MANAGER', 
                    'PEDAGOGICAL_MANAGER',
                    'EXECUTIVE_DIRECTOR'
                  ]} 
                />
              }
            >
              <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />
            </Route>
            
            {/* Default redirect to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 