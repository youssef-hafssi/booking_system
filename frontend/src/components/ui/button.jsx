import React from 'react';
import { cn } from '../../utils/cn';

const Button = ({ 
  children, 
  className, 
  variant = 'solid',  // solid, outline, ghost, primary
  size = 'md',        // sm, md, lg
  color = 'brand',     // brand, blue, red, green, yellow, gray
  disabled = false,
  loading = false,
  ...props 
}) => {
  // Base styles
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';
  
  // Size styles
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  // Color styles for each variant
  const variantClasses = {
    primary: {
      brand: 'bg-brand-primary hover:bg-brand-hover text-white focus:ring-brand-primary',
      blue: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      red: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      green: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
      yellow: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500',
      gray: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    },
    solid: {
      brand: 'bg-brand-primary hover:bg-brand-hover text-white focus:ring-brand-primary',
      blue: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      red: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      green: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
      yellow: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500',
      gray: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    },
    outline: {
      brand: 'border border-brand-primary text-brand-primary hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 focus:ring-brand-primary',
      blue: 'border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500',
      red: 'border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500',
      green: 'border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 focus:ring-green-500',
      yellow: 'border border-yellow-500 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:ring-yellow-500',
      gray: 'border border-gray-600 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20 focus:ring-gray-500',
    },
    ghost: {
      brand: 'text-brand-primary hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 dark:text-brand-light focus:ring-brand-primary',
      blue: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-blue-400 focus:ring-blue-500',
      red: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 focus:ring-red-500',
      green: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 dark:text-green-400 focus:ring-green-500',
      yellow: 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 dark:text-yellow-400 focus:ring-yellow-500',
      gray: 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:text-gray-400 focus:ring-gray-500',
    }
  };

  const classes = cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant][color],
    disabled && 'opacity-50 cursor-not-allowed',
    loading && 'pointer-events-none',
    className
  );

  return (
    <button 
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-current"></span>
          Loading...
        </>
      ) : children}
    </button>
  );
};

export default Button;