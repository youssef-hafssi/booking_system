import React, { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';

const DateRangePicker = ({ 
  value = { startDate: new Date(), endDate: new Date() },
  onChange,
  className,
  ...props 
}) => {
  // Format dates for the input fields
  const formatDateForInput = (date) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  // Parse dates from string to Date objects
  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      return new Date(dateString);
    } catch (e) {
      console.error("Invalid date:", e);
      return null;
    }
  };

  // Handle start date change
  const handleStartDateChange = (e) => {
    const startDate = parseDate(e.target.value);
    
    if (startDate) {
      onChange({
        startDate,
        endDate: value.endDate
      });
    }
  };

  // Handle end date change
  const handleEndDateChange = (e) => {
    const endDate = parseDate(e.target.value);
    
    if (endDate) {
      onChange({
        startDate: value.startDate,
        endDate
      });
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <div className="relative flex-1">
        <input
          type="date"
          value={formatDateForInput(value.startDate)}
          onChange={handleStartDateChange}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>
      
      <span className="text-gray-500">-</span>
      
      <div className="relative flex-1">
        <input
          type="date"
          value={formatDateForInput(value.endDate)}
          onChange={handleEndDateChange}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>
    </div>
  );
};

export default DateRangePicker; 