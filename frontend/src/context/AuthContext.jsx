import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// Create the auth context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If we have a token, validate it and get user data
    const validateToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Call the validate token endpoint
        const response = await axios.get(`${API_URL}/auth/validate`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.valid) {
          try {
            // Get user data using the email from validation
            const userResponse = await axios.get(`${API_URL}/users/email/${response.data.email}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            
            // Ensure that we have the user ID
            const userData = userResponse.data;
            if (!userData.id && userData.userId) {
              userData.id = userData.userId; // Ensure we have id property if backend returns userId
            }
            
            // Log user data for debugging center assignment
            console.log("User data from API:", userData);
            console.log("User's center assignment:", userData.centerId || userData.center?.id || "None");
            
            setUser(userData);
          } catch (userError) {
            console.error('Failed to fetch user data:', userError);
            // If we can't get user data but token is valid, we can still stay logged in
            // with minimal info from the token validation
            setUser({
              email: response.data.email,
              role: response.data.role || 'STUDENT' // Default to STUDENT if role not in token
            });
          }
        } else {
          // Token is invalid, clear local storage
          logout();
        }
      } catch (err) {
        console.error('Token validation error:', err);
        // On server error, don't immediately logout - this prevents login loop
        // Only logout if it's an authorization error (401)
        if (err.response && err.response.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  // Configure axios to include the token in all requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      // Save the token in localStorage
      localStorage.setItem('token', response.data.token);
      
      // Update state
      setToken(response.data.token);
      
      // Ensure that the response includes the user ID
      const userData = response.data.user;
      if (!userData.id && userData.userId) {
        userData.id = userData.userId; // Ensure we have id property if backend returns userId
      }
      
      setUser(userData);
      
      return userData;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      // Always set role to STUDENT for public registration
      const userWithRole = { ...userData, role: 'STUDENT' };
      
      // Convert centerId to a number if it's provided as a string
      if (userWithRole.centerId) {
        userWithRole.centerId = Number(userWithRole.centerId);
      }
      
      const response = await axios.post(`${API_URL}/auth/register`, userWithRole);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
      throw err;
    }
  };

  const logout = () => {
    // Clear the token from localStorage
    localStorage.removeItem('token');
    
    // Clear state
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 