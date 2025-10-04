import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Unauthorized() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg text-center">
        <svg
          className="mx-auto h-16 w-16 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        
        <h1 className="mt-4 text-2xl font-bold text-gray-900">404 Not Found</h1>
        
        <p className="mt-2 text-gray-600">
          The page you're looking for doesn't exist.
        </p>
        
        {user && (
          <p className="mt-1 text-sm text-gray-500">
            Your current role: <span className="font-semibold">{user.role}</span>
          </p>
        )}
        
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-hover"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized; 