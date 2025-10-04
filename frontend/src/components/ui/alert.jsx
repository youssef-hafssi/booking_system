import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const Alert = ({ 
  children, 
  className, 
  type = 'info', // info, success, warning, error
  duration = 5000, // duration in ms, null for permanent
  onClose,
  ...props 
}) => {
  const [visible, setVisible] = useState(true);
  
  // Auto-dismiss alert after duration
  useEffect(() => {
    if (duration !== null) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);
  
  // Handle close click
  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };
  
  // If not visible, don't render
  if (!visible) return null;
  
  // Alert type styles
  const alertStyles = {
    info: {
      container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-300',
      icon: <FiInfo className="w-5 h-5 text-blue-500" />
    },
    success: {
      container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-300',
      icon: <FiCheckCircle className="w-5 h-5 text-green-500" />
    },
    warning: {
      container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-300',
      icon: <FiAlertCircle className="w-5 h-5 text-yellow-500" />
    },
    error: {
      container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-300',
      icon: <FiAlertCircle className="w-5 h-5 text-red-500" />
    }
  };
  
  const style = alertStyles[type];
  
  return (
    <div
      className={cn(
        'flex items-start p-4 mb-4 border rounded-lg',
        style.container,
        style.text,
        className
      )}
      role="alert"
      {...props}
    >
      <div className="flex-shrink-0 mr-3 mt-0.5">
        {style.icon}
      </div>
      <div className="flex-1">
        {children}
      </div>
      <button
        type="button"
        className="flex-shrink-0 ml-3 -mr-1 -mt-1 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2"
        onClick={handleClose}
        aria-label="Close"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Alert; 