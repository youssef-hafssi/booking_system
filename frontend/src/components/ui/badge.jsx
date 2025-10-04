import React from 'react';
import { cn } from '../../utils/cn';

const Badge = ({ 
  children, 
  className, 
  color = 'gray', // gray, brand, blue, green, red, yellow, purple
  variant = 'solid', // solid, outline
  size = 'md', // sm, md, lg
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full';
  
  // Size variants
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };
  
  // Color variants
  const colorVariants = {
    solid: {
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      brand: 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-light',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    },
    outline: {
      gray: 'border border-gray-500 text-gray-700 dark:text-gray-300',
      brand: 'border border-brand-primary text-brand-primary dark:text-brand-light',
      blue: 'border border-blue-500 text-blue-700 dark:text-blue-300',
      green: 'border border-green-500 text-green-700 dark:text-green-300',
      red: 'border border-red-500 text-red-700 dark:text-red-300',
      yellow: 'border border-yellow-500 text-yellow-700 dark:text-yellow-300',
      purple: 'border border-purple-500 text-purple-700 dark:text-purple-300'
    }
  };
  
  return (
    <span
      className={cn(
        baseClasses,
        sizeClasses[size],
        colorVariants[variant][color],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge; 