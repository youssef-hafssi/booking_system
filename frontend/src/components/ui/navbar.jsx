import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../Logo';
import ThemeToggle from '../ThemeToggle';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence, useScroll } from 'motion/react';

// Icons
import { AiOutlineHome, AiOutlineUser, AiOutlineCalendar } from 'react-icons/ai';
import { BsBuilding, BsDoorOpen, BsLaptop } from 'react-icons/bs';
import { MdOutlineSchedule } from 'react-icons/md';
import { HiOutlineUserGroup, HiOutlineMenuAlt3, HiOutlineX } from 'react-icons/hi';
import { FiTool, FiAlertTriangle } from 'react-icons/fi';

// Scroll Progress Bar component
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  
  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300"
      style={{
        scaleX: scrollYProgress,
      }}
    />
  );
};

const NavItem = ({ to, active, children, mobile, onClick }) => {
  return (
    <Link
      to={to}
      className={cn(
        "relative px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm flex items-center overflow-hidden",
        active 
          ? "text-brand-primary dark:text-brand-light bg-brand-primary/10 dark:bg-brand-primary/20" 
          : "text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-light hover:bg-brand-primary/10 dark:hover:bg-brand-primary/10",
        mobile && "w-full"
      )}
      onClick={onClick}
    >
      {children}
      {active && (
        <>
          <motion.span 
            className="absolute inset-0 rounded-lg ring-2 ring-brand-primary/30 dark:ring-brand-primary/20"
            layoutId="navHighlight"
            transition={{ 
              type: "spring", 
              bounce: 0.2, 
              duration: 0.6 
            }}
          />
          <motion.span 
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
            layoutId="navIndicator"
            transition={{ 
              type: "spring", 
              bounce: 0.2, 
              duration: 0.6 
            }}
          />
        </>
      )}
    </Link>
  );
};

const MagicNavbar = ({ hasElevatedPrivileges, isAdmin, canAccessCentersManagement }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const prevScrollY = useRef(0);
  const [direction, setDirection] = useState("none"); // "up", "down", or "none"

  // Function to check if a link is active
  const isActive = (path) => {
    return location.pathname === path || 
           (path !== '/dashboard' && location.pathname.startsWith(path));
  };
  
  // Handle scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine scroll direction
      if (currentScrollY > prevScrollY.current) {
        setDirection("down");
      } else if (currentScrollY < prevScrollY.current) {
        setDirection("up");
      }
      
      prevScrollY.current = currentScrollY;
      
      // Set scrolled state for styling
      if (currentScrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Animation variants
  const navVariants = {
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        y: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    hidden: { 
      y: -20, 
      opacity: 0,
      transition: {
        y: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    }
  };

  return (
    <>
      <ScrollProgress />
      <motion.header 
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300 backdrop-blur-md",
          scrolled 
            ? "bg-white/80 dark:bg-gray-900/80 shadow-sm" 
            : "bg-transparent"
        )}
        variants={navVariants}
        initial="visible"
        animate={direction === "down" && scrolled ? "hidden" : "visible"}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and brand */}
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Logo width={40} height={40} className="py-1" />
              <span className="font-semibold text-xl text-gray-900 dark:text-white">Workstation<span className="text-blue-500">OS</span></span>
            </motion.div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <NavItem to="/dashboard" active={isActive('/dashboard') && !location.pathname.includes('/admin')}>
                <AiOutlineHome className="mr-2 text-lg" />
                Dashboard
              </NavItem>
              
              <NavItem to="/dashboard/profile" active={isActive('/dashboard/profile')}>
                <AiOutlineUser className="mr-2 text-lg" />
                Profile
              </NavItem>
              
              {!hasElevatedPrivileges && (
                <NavItem to="/dashboard/workstations" active={isActive('/dashboard/workstations')}>
                  <BsLaptop className="mr-2 text-lg" />
                  Workstations
                </NavItem>
              )}
              
              {user?.role !== 'CENTER_MANAGER' && !hasElevatedPrivileges && (
                <NavItem to="/dashboard/reservations" active={isActive('/dashboard/reservations') && !location.pathname.includes('/admin')}>
                  <AiOutlineCalendar className="mr-2 text-lg" />
                  Reservations
                </NavItem>
              )}
              
              {hasElevatedPrivileges && (
                <>
                <NavItem to="/dashboard/admin" active={location.pathname.includes('/admin')}>
                  <MdOutlineSchedule className="mr-2 text-lg" />
                  Admin
                </NavItem>
                  {isAdmin && (
                    <>
                    <NavItem to="/dashboard/admin/maintenance" active={isActive('/dashboard/admin/maintenance')}>
                      <FiTool className="mr-2 text-lg" />
                      Maintenance
                    </NavItem>
                      <NavItem to="/dashboard/admin/penalties" active={isActive('/dashboard/admin/penalties')}>
                        <FiAlertTriangle className="mr-2 text-lg" />
                        Penalties
                      </NavItem>
                    </>
                  )}
                </>
              )}
            </nav>

            {/* Right side items */}
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ThemeToggle />
              
              {/* User menu */}
              <div className="relative group">
                <motion.button 
                  className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-full py-1 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{user?.firstName || 'User'}</span>
                  <motion.div 
                    className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center uppercase"
                    whileHover={{ scale: 1.1 }}
                  >
                    {user?.firstName?.charAt(0) || 'U'}
                  </motion.div>
                </motion.button>
                
                {/* Dropdown menu */}
                <motion.div 
                  className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 transform origin-top"
                  initial={{ scaleY: 0.8, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  exit={{ scaleY: 0.8, opacity: 0 }}
                >
                  <Link to="/dashboard/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Your Profile</Link>
                  <Link to="/dashboard/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Settings</Link>
                  <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                    Sign out
                  </button>
                </motion.div>
              </div>
              
              {/* Mobile menu button */}
              <motion.button
                className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isOpen ? <HiOutlineX className="h-6 w-6" /> : <HiOutlineMenuAlt3 className="h-6 w-6" />}
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="md:hidden bg-white dark:bg-gray-900 shadow-xl rounded-b-xl overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 pt-2 pb-4 space-y-2">
                <NavItem to="/dashboard" active={isActive('/dashboard') && !location.pathname.includes('/admin')} mobile onClick={() => setIsOpen(false)}>
                  <AiOutlineHome className="mr-3 text-lg" />
                  Dashboard
                </NavItem>
                
                <NavItem to="/dashboard/profile" active={isActive('/dashboard/profile')} mobile onClick={() => setIsOpen(false)}>
                  <AiOutlineUser className="mr-3 text-lg" />
                  My Profile
                </NavItem>
                
                {!hasElevatedPrivileges && (
                  <NavItem to="/dashboard/workstations" active={isActive('/dashboard/workstations')} mobile onClick={() => setIsOpen(false)}>
                    <BsLaptop className="mr-3 text-lg" />
                    Find Workstations
                  </NavItem>
                )}
                
                {user?.role !== 'CENTER_MANAGER' && !hasElevatedPrivileges && (
                  <NavItem to="/dashboard/reservations" active={isActive('/dashboard/reservations') && !location.pathname.includes('/admin')} mobile onClick={() => setIsOpen(false)}>
                    <AiOutlineCalendar className="mr-3 text-lg" />
                    My Reservations
                  </NavItem>
                )}
                
                {/* Admin section */}
                {hasElevatedPrivileges && (
                  <motion.div 
                    className="pt-4 space-y-2 border-t border-gray-200 dark:border-gray-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Administration
                    </div>
                    
                    <NavItem 
                      to="/dashboard/admin" 
                      active={isActive('/dashboard/admin') && !isActive('/dashboard/admin/users') && !isActive('/dashboard/admin/centers')} 
                      mobile 
                      onClick={() => setIsOpen(false)}
                    >
                      <AiOutlineHome className="mr-3 text-lg" />
                      Admin Dashboard
                    </NavItem>
                    
                    {isAdmin && (
                      <>
                      <NavItem to="/dashboard/admin/users" active={isActive('/dashboard/admin/users')} mobile onClick={() => setIsOpen(false)}>
                        <HiOutlineUserGroup className="mr-3 text-lg" />
                        User Management
                      </NavItem>
                        <NavItem to="/dashboard/admin/maintenance" active={isActive('/dashboard/admin/maintenance')} mobile onClick={() => setIsOpen(false)}>
                          <FiTool className="mr-3 text-lg" />
                          Maintenance Management
                        </NavItem>
                        <NavItem to="/dashboard/admin/penalties" active={isActive('/dashboard/admin/penalties')} mobile onClick={() => setIsOpen(false)}>
                          <FiAlertTriangle className="mr-3 text-lg" />
                          Penalty Management
                        </NavItem>
                      </>
                    )}
                    
                    {canAccessCentersManagement && (
                      <NavItem to="/dashboard/admin/centers" active={isActive('/dashboard/admin/centers')} mobile onClick={() => setIsOpen(false)}>
                        <BsBuilding className="mr-3 text-lg" />
                        Centers Management
                      </NavItem>
                    )}
                    
                    <NavItem to="/dashboard/admin/rooms" active={isActive('/dashboard/admin/rooms')} mobile onClick={() => setIsOpen(false)}>
                      <BsDoorOpen className="mr-3 text-lg" />
                      Rooms Management
                    </NavItem>
                    
                    <NavItem to="/dashboard/admin/workstations" active={isActive('/dashboard/admin/workstations')} mobile onClick={() => setIsOpen(false)}>
                      <BsLaptop className="mr-3 text-lg" />
                      Workstations Management
                    </NavItem>
                    
                    <NavItem to="/dashboard/admin/reservations" active={isActive('/dashboard/admin/reservations')} mobile onClick={() => setIsOpen(false)}>
                      <MdOutlineSchedule className="mr-3 text-lg" />
                      Reservations Management
                    </NavItem>
                  </motion.div>
                )}
                
                {/* Mobile logout button */}
                <motion.div 
                  className="pt-4 border-t border-gray-200 dark:border-gray-700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.button 
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Sign out
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
};

export default MagicNavbar; 