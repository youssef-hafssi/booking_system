import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  size = 'md', 
  className,
  overlayClassName,
  contentClassName,
  closeOnOverlayClick = true,
  ...props 
}) => {
  // Initialize refs at the top level
  const modalRoot = useRef(null);
  const modalRef = useRef(null);

  // Setup modal root
  useEffect(() => {
    if (!modalRoot.current) {
      let existingRoot = document.getElementById('modal-root');
      if (!existingRoot) {
        existingRoot = document.createElement('div');
        existingRoot.id = 'modal-root';
        document.body.appendChild(existingRoot);
      }
      modalRoot.current = existingRoot;
    }

    return () => {
      if (modalRoot.current && !document.getElementById('modal-root')) {
        document.body.removeChild(modalRoot.current);
      }
    };
  }, []);

  // Handle scroll lock
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  // Handle focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Get size class
  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  }[size] || 'max-w-lg';

  // Portal the modal to the modal root
  if (!modalRoot.current) return null;

  return createPortal(
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm",
        overlayClassName
      )}
      onClick={closeOnOverlayClick ? onClose : undefined}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      {...props}
    >
      <div 
        ref={modalRef}
        className={cn(
          "relative w-full mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl",
          sizeClass,
          className
        )}
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
              aria-label="Close"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className={cn("p-6", contentClassName)}>
          {children}
        </div>
      </div>
    </div>,
    modalRoot.current
  );
};

export default Modal;