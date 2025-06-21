// app/components/common/ToastMessage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';

interface ToastMessageProps {
  message: string | null;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

// An inner component to manage the lifecycle of a single toast notification.
const SingleToast: React.FC<ToastMessageProps> = ({ message, type = 'info', duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // When the component mounts, make it visible.
    const showTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    // Set a timer to hide it after the specified duration.
    const hideTimeout = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, [duration, type]);

  const handleClose = () => {
    setIsVisible(false);
  };

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
      default:
        return {
          icon: <FiInfo className="w-5 h-5 text-blue-400" />,
          borderColor: 'border-blue-400/20',
          iconBg: 'bg-blue-400/10',
        };
    }
  };

  const config = getToastConfig(type);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 p-4 rounded-md shadow-xl z-[5000] text-white
            bg-black/50 backdrop-blur-md border ${config.borderColor}
            transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
            w-full max-w-sm sm:max-w-md`}
    >
      <div className="flex gap-3 items-center">
        <div className={`flex-shrink-0 p-2 rounded-md ${config.iconBg}`}>{config.icon}</div>
        <div className="flex-grow leading-relaxed text-white/90">{message}</div>
        <button
          onClick={handleClose}
          className="ml-4 flex-shrink-0 p-1.5 rounded-md transition-colors duration-200 cursor-pointer hover:bg-white/10 group"
          aria-label="Close notification"
        >
          <FiX className="w-5 h-5 text-neutral-400 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
};

// The main component now acts as a controller to re-trigger the toast animation
// even if the same message is sent multiple times.
const ToastMessage: React.FC<ToastMessageProps> = ({ message, type = 'info', duration = 5000 }) => {
  const [toastKey, setToastKey] = useState(0);

  useEffect(() => {
    if (message) {
      setToastKey(prevKey => prevKey + 1);
    }
  }, [message]);

  if (!message) {
    return null;
  }

  return <SingleToast key={toastKey} message={message} type={type} duration={duration} />;
};

export default ToastMessage;
