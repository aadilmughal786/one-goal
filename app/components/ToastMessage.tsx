// src/components/ToastMessage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

interface ToastMessageProps {
  message: string | null;
  type?: 'success' | 'error' | 'info'; // Optional type, defaults to 'info'
  duration?: number; // Optional duration in milliseconds, defaults to 5000
}

const ToastMessage: React.FC<ToastMessageProps> = ({ message, type = 'info', duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show the toast if a message is provided
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      // Clean up the timer if the message changes or component unmounts
      return () => clearTimeout(timer);
    } else {
      // If message is null or empty, ensure the toast is hidden
      setIsVisible(false);
    }
  }, [message, type, duration]); // Re-run effect if message, type, or duration changes

  // Handler for manually closing the toast
  const handleClose = () => {
    setIsVisible(false);
  };

  // Do not render anything if there's no message or if it's not visible
  if (!message || !isVisible) return null;

  // Determines the icon, border color, and icon background based on the toast type
  const getToastConfig = (currentType: 'success' | 'error' | 'info') => {
    switch (currentType) {
      case 'success':
        return {
          icon: <FiCheckCircle className="w-5 h-5 text-green-400" />,
          borderColor: 'border-green-400/20',
          iconBg: 'bg-green-400/10',
        };
      case 'error':
        return {
          icon: <FiAlertCircle className="w-5 h-5 text-red-400" />,
          borderColor: 'border-red-400/20',
          iconBg: 'bg-red-400/10',
        };
      case 'info':
        return {
          icon: <FiInfo className="w-5 h-5 text-blue-400" />,
          borderColor: 'border-blue-400/20',
          iconBg: 'bg-blue-400/10',
        };
      default:
        // Fallback for unexpected types, though TS should prevent this
        return {
          icon: <FiInfo className="w-5 h-5 text-blue-400" />,
          borderColor: 'border-blue-400/20',
          iconBg: 'bg-blue-400/10',
        };
    }
  };

  const config = getToastConfig(type); // Get configuration for the current toast type

  return (
    <div
      // ARIA attributes for accessibility:
      // role="status" indicates that the element is a live region whose content is advisory information.
      // aria-live="polite" indicates that assistive technologies should announce updates politely,
      // without interrupting the user's current task.
      role="status"
      aria-live="polite"
      className={`fixed top-6 left-1/2 -translate-x-1/2 p-4 rounded-xl shadow-xl z-[5000] text-white
      bg-white/[0.02] backdrop-blur-sm border ${config.borderColor}
      transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      max-w-md w-full mx-4 hover:bg-white/[0.04] hover:border-white/20`}
    >
      <div className="flex gap-3 items-start">
        {/* Toast Icon */}
        <div className={`flex-shrink-0 p-2 rounded-lg ${config.iconBg}`}>{config.icon}</div>

        {/* Message Text Content */}
        <div className="flex-grow leading-relaxed text-white/90">{message}</div>

        {/* Close Button for user dismissal */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded-lg transition-colors duration-200 bg-white/5 hover:bg-white/10 group"
          aria-label="Close notification" // Accessible label for the close button
        >
          <FiX className="w-4 h-4 text-white/60 group-hover:text-white/90" />
        </button>
      </div>
    </div>
  );
};

export default ToastMessage;
