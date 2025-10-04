import React, { useState } from 'react';
import { motion } from 'framer-motion';

const getButtonClasses = (variant = 'primary', size = 'md') => {
  const baseClasses = "relative inline-flex items-center justify-center overflow-hidden font-medium transition-all rounded-md group";
  
  const variantClasses = {
    primary: "bg-white dark:bg-gray-900 text-black dark:text-white border border-gray-300 dark:border-gray-600",
    secondary: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700",
    accent: "bg-yellow-400 dark:bg-yellow-500 text-black dark:text-black border border-yellow-400 dark:border-yellow-500",
  };
  
  const sizeClasses = {
    sm: "text-sm py-2 px-4",
    md: "text-base py-3 px-6",
    lg: "text-lg py-4 px-8",
  };
  
  return `${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md}`;
};

const InteractiveHoverButton = ({ 
  children, 
  className, 
  variant, 
  size,
  ...props 
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  };

  return (
    <motion.button
      className={`${getButtonClasses(variant, size)} ${className || ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      
      {/* Animated gradient */}
      <motion.span 
        className="absolute inset-0 overflow-hidden rounded-md z-0"
        initial={{ background: "transparent" }}
        animate={{
          background: isHovered 
            ? `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 203, 20, 0.4) 0%, rgba(229, 231, 235, 0) 50%)`
            : "transparent"
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Border effect */}
      <motion.span 
        className="absolute inset-0 rounded-md"
        style={{
          boxShadow: isHovered 
            ? `0 0 0 1px rgba(255, 203, 20, 0.4) inset` 
            : `0 0 0 1px rgba(229, 231, 235, 0) inset`
        }}
        animate={{
          boxShadow: isHovered 
            ? `0 0 0 1.5px ${variant === 'accent' ? 'rgba(255, 203, 20, 0.8)' : 'rgba(255, 203, 20, 0.4)'} inset` 
            : `0 0 0 1px rgba(229, 231, 235, 0) inset`
        }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
};

export default InteractiveHoverButton; 