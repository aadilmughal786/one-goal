// app/components/common/ToastMessage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';

import { useNotificationStore } from '@/store/useNotificationStore';

const ToastMessage: React.FC = () => {
  const { key, message, type } = useNotificationStore(state => state.toast);

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message, key]);

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
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 p-4 rounded-md shadow-xl z-[5000] text-text-primary
        bg-bg-secondary/50 backdrop-blur-md border ${config.borderColor}
        transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        w-full max-w-sm sm:max-w-md`}
    >
      <div className="flex gap-3 items-center">
        <div className={`flex-shrink-0 p-2 rounded-md ${config.iconBg}`}>{config.icon}</div>
        <div className="flex-grow leading-relaxed text-text-primary">{message}</div>
        <button
          onClick={handleClose}
          className="ml-4 flex-shrink-0 p-1.5 rounded-md transition-colors duration-200 hover:bg-bg-tertiary group cursor-pointer"
        >
          <FiX className="w-5 h-5 text-text-muted group-hover:text-text-primary" />
        </button>
      </div>
    </div>
  );
};

export default ToastMessage;
