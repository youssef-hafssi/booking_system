import React, { useState } from 'react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { cn } from '../../utils/cn';
import { CalendarIcon, ChevronUpIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import * as Popover from '@radix-ui/react-popover';

const TimeSelect = ({ value, onChange, className }) => {
  const hours = new Date(value || Date.now()).getHours();
  const minutes = new Date(value || Date.now()).getMinutes();

  const incrementHour = () => {
    if (!value) return;
    const newDate = new Date(value);
    newDate.setHours((hours + 1) % 24);
    onChange(newDate);
  };

  const decrementHour = () => {
    if (!value) return;
    const newDate = new Date(value);
    newDate.setHours((hours - 1 + 24) % 24);
    onChange(newDate);
  };

  const incrementMinute = () => {
    if (!value) return;
    const newDate = new Date(value);
    newDate.setMinutes((minutes + 15) % 60);
    onChange(newDate);
  };

  const decrementMinute = () => {
    if (!value) return;
    const newDate = new Date(value);
    newDate.setMinutes((minutes - 15 + 60) % 60);
    onChange(newDate);
  };

  return (
    <div className={cn("flex flex-col items-center p-4 space-y-4", className)}>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Time</h3>
      
      <div className="flex space-x-4">
        {/* Hours */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={incrementHour}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ChevronUpIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="w-12 h-10 flex items-center justify-center text-lg font-semibold bg-gray-50 dark:bg-gray-800 rounded-lg">
            {value ? format(new Date(value), 'HH') : '00'}
          </div>
          
          <button
            type="button"
            onClick={decrementHour}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ChevronDownIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex items-center text-xl font-semibold text-gray-600 dark:text-gray-400">:</div>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={incrementMinute}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ChevronUpIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="w-12 h-10 flex items-center justify-center text-lg font-semibold bg-gray-50 dark:bg-gray-800 rounded-lg">
            {value ? format(new Date(value), 'mm') : '00'}
          </div>
          
          <button
            type="button"
            onClick={decrementMinute}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ChevronDownIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DateTimePicker({ 
  value,
  onChange,
  className,
  placeholder = "Select date and time...",
  ...props 
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (date) => {
    if (!date) return;
    
    // Preserve the time from the existing value or use current time
    const existingDate = value ? new Date(value) : new Date();
    const newDate = new Date(date);
    newDate.setHours(existingDate.getHours());
    newDate.setMinutes(existingDate.getMinutes());
    
    onChange(newDate);
  };

  return (
    <div className={cn("relative", className)} {...props}>
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={cn(
              "w-full flex items-center justify-between rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2",
              "focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none",
              "transition-colors duration-200",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            )}
          >
            <span className={cn(
              value ? "" : "text-gray-500",
              "flex-1 text-left"
            )}>
              {value ? format(new Date(value), "PPP p") : placeholder}
            </span>
            <CalendarIcon className="ml-2 h-4 w-4 text-gray-500" />
          </button>
        </Popover.Trigger>

        <Popover.Content
          align="start"
          className="z-50 rounded-lg border border-gray-200 bg-white shadow-md outline-none dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex">
            <div className="border-r border-gray-200 dark:border-gray-700">
              <DayPicker
                mode="single"
                selected={value}
                onSelect={handleSelect}
                initialFocus={true}
                className={cn(
                  "p-3",
                  // Custom styles for the calendar
                  "[&_.rdp-day]:rounded-lg [&_.rdp-day:hover]:bg-gray-100 dark:[&_.rdp-day:hover]:bg-gray-800",
                  "[&_.rdp-day_button]:h-9 [&_.rdp-day_button]:w-9",
                  "[&_.rdp-day_button:hover]:bg-blue-50 dark:[&_.rdp-day_button:hover]:bg-blue-900",
                  "[&_.rdp-day_button:focus]:bg-blue-50 dark:[&_.rdp-day_button:focus]:bg-blue-900",
                  "[&_.rdp-day_button:focus]:ring-2 [&_.rdp-day_button:focus]:ring-blue-500",
                  "[&_.rdp-day_button.rdp-day_selected]:bg-blue-500",
                  "[&_.rdp-day_button.rdp-day_selected]:text-white",
                  "dark:[&_.rdp-day_button.rdp-day_selected]:bg-blue-600",
                  "[&_.rdp-head_cell]:font-normal [&_.rdp-head_cell]:text-gray-500 dark:[&_.rdp-head_cell]:text-gray-400"
                )}
              />
            </div>
            
            <TimeSelect value={value} onChange={onChange} />
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
} 