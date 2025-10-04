import React, { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';
import { ChevronUpIcon, ChevronDownIcon, ClockIcon } from '@radix-ui/react-icons';
import * as Popover from '@radix-ui/react-popover';

export default function TimePicker({ 
  value,
  onChange,
  className,
  placeholder = "Select time...",
  ...props 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hours = value ? new Date(value).getHours() : 0;
  const minutes = value ? new Date(value).getMinutes() : 0;

  const handleTimeChange = (newHours, newMinutes) => {
    const date = value ? new Date(value) : new Date();
    date.setHours(newHours);
    date.setMinutes(newMinutes);
    onChange(date);
  };

  const incrementHour = () => {
    handleTimeChange((hours + 1) % 24, minutes);
  };

  const decrementHour = () => {
    handleTimeChange((hours - 1 + 24) % 24, minutes);
  };

  const incrementMinute = () => {
    handleTimeChange(hours, (minutes + 15) % 60);
  };

  const decrementMinute = () => {
    handleTimeChange(hours, (minutes - 15 + 60) % 60);
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
              {value ? format(new Date(value), "p") : placeholder}
            </span>
            <ClockIcon className="ml-2 h-4 w-4 text-gray-500" />
          </button>
        </Popover.Trigger>

        <Popover.Content
          align="start"
          className="z-50 rounded-lg border border-gray-200 bg-white shadow-md outline-none dark:border-gray-800 dark:bg-gray-900 p-4"
        >
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Time</h3>
            
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
                  {String(hours).padStart(2, '0')}
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
                  {String(minutes).padStart(2, '0')}
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
        </Popover.Content>
      </Popover.Root>
    </div>
  );
} 