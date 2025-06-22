// app/components/common/ToastMessage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';

// --- REFLECTING THE REFACTOR ---
// We now import the Zustand store to get the toast's state.
import { useNotificationStore } from '@/store/useNotificationStore';

/**
 * ToastMessage component.
 * It is rendered once in the root layout and listens to the `useNotificationStore`
 * to display messages. The `key` property on the toast state ensures the
 * fade-in/out animation re-triggers for consecutive messages.
 */
const ToastMessage: React.FC = () => {
  // This component now subscribes directly to the toast state from the store.
  const { key, message, type } = useNotificationStore(state => state.toast);

  const [isVisible, setIsVisible] = useState(false);

  // This effect runs whenever a new toast is triggered (by a change in message or key).
  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000); // Hide after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [message, key]); // Re-run when the message or its key changes.

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
      default:
        return {
          icon: <FiInfo className="w-5 h-5 text-blue-400" />,
          borderColor: 'border-blue-400/20',
          iconBg: 'bg-blue-400/10',
        };
    }
  };

  if (!message) {
    return null;
  }

  const config = getToastConfig(type);

  return (
    <div
      key={key}
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
        >
          <FiX className="w-5 h-5 text-neutral-400 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
};

export default ToastMessage;
