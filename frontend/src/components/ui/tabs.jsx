import React, { useState } from 'react';
import { cn } from '../../utils/cn';

// Tab Component
const Tab = ({
  children,
  className,
  isActive,
  onClick,
  disabled,
  ...props
}) => {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none relative',
        isActive 
          ? 'text-brand-primary dark:text-brand-light bg-brand-primary/10 dark:bg-brand-primary/20' 
          : 'text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-light hover:bg-gray-100 dark:hover:bg-gray-700/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// TabList Component
const TabList = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      role="tablist"
      className={cn(
        'flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// TabPanel Component
const TabPanel = ({
  children,
  className,
  isActive,
  ...props
}) => {
  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      className={cn(
        'mt-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Tabs Component
const Tabs = ({
  children,
  defaultIndex = 0,
  onChange,
  className,
  ...props
}) => {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  // Handle tab change
  const handleTabChange = (index) => {
    setActiveIndex(index);
    if (onChange) {
      onChange(index);
    }
  };

  // Clone children with additional props
  const enhancedChildren = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;

    if (child.type === TabList) {
      return React.cloneElement(child, {
        children: React.Children.map(child.props.children, (tab, tabIndex) => {
          if (!React.isValidElement(tab)) return tab;
          if (tab.type === Tab) {
            return React.cloneElement(tab, {
              isActive: tabIndex === activeIndex,
              onClick: () => handleTabChange(tabIndex),
            });
          }
          return tab;
        }),
      });
    }

    if (child.type === TabPanel) {
      return React.cloneElement(child, {
        isActive: index - 1 === activeIndex, // Assuming TabList is first child
      });
    }

    return child;
  });

  return (
    <div className={cn('', className)} {...props}>
      {enhancedChildren}
    </div>
  );
};

// Attach sub-components to Tabs
Tabs.Tab = Tab;
Tabs.TabList = TabList;
Tabs.TabPanel = TabPanel;

export default Tabs; 