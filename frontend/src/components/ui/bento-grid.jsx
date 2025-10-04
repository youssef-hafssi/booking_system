import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";

const BentoGrid = ({ 
  className,
  children
}) => {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 max-w-7xl mx-auto",
      className
    )}>
      {children}
    </div>
  );
};

export default BentoGrid;
export { BentoGrid };

export const BentoCard = ({
  className,
  Icon,
  name,
  description,
  cta,
  href,
  background
}) => {
  return (
    <Link 
      to={href}
      className={cn(
        "group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800",
        "bg-white p-6 dark:bg-dark-sidebar shadow-md",
        "transition-all hover:shadow-xl",
        className
      )}
    >
      {background && background}
      
      <div className="relative z-10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {description}
        </p>
        <div className="flex items-center">
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
            {cta} →
          </span>
        </div>
      </div>
    </Link>
  );
};

// With hover effect and animation
export const AnimatedBentoCard = ({
  className,
  Icon,
  name,
  description,
  cta,
  href,
  background
}) => {
  return (
    <Link 
      to={href}
      className={cn(
        "group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800",
        "bg-white p-6 dark:bg-dark-sidebar shadow-md",
        "transition-all duration-300 hover:shadow-xl",
        "hover:border-brand-primary dark:hover:border-brand-primary",
        className
      )}
    >
      {background && background}
      
      <div className="relative z-10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors group-hover:text-brand-primary dark:group-hover:text-brand-light">
          {name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {description}
        </p>
        <div className="flex items-center">
          <span className="text-sm font-medium text-brand-primary dark:text-brand-light group-hover:underline transform transition-transform group-hover:translate-x-1">
            {cta} →
          </span>
        </div>
      </div>
      
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-brand-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Link>
  );
}; 