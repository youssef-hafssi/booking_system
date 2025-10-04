import React, { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import logoImage from '../assets/logo.png';

// MagicUI-inspired logo component with transparent background
const Logo = ({ width = 180, height = 70, animated = true, className = '' }) => {
  const logoRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    if (!animated || !logoRef.current) return;
    const rect = logoRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div 
      ref={logoRef}
      className={`relative overflow-hidden group ${className}`}
      style={{ 
        width, 
        height,
        backgroundColor: 'transparent' 
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Base logo with transparent background */}
      <img 
        src={logoImage} 
        alt="WEB4JOBS Logo" 
        className="w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
        style={{ 
          mixBlendMode: 'multiply',
          filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.1))'
        }}
      />

      {/* Animated glow effect with transparency */}
      {animated && (
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-70 pointer-events-none transition-opacity"
          style={{
            mixBlendMode: 'screen',
            background: useMotionTemplate`
              radial-gradient(
                180px circle at ${mouseX}px ${mouseY}px,
                rgba(158, 122, 255, 0.15),
                rgba(254, 139, 187, 0.15),
                rgba(0, 0, 0, 0) 70%
              )
            `,
          }}
        />
      )}

      {/* Border glow on hover with transparency */}
      <div className="absolute inset-0 pointer-events-none border border-transparent opacity-0 group-hover:opacity-100 rounded-md transition-opacity duration-300"
        style={{
          mixBlendMode: 'screen',
          boxShadow: '0 0 15px rgba(158, 122, 255, 0.3)',
          background: 'linear-gradient(45deg, rgba(158, 122, 255, 0.1), rgba(254, 139, 187, 0.1))',
        }}
      />
    </div>
  );
};

export default Logo; 