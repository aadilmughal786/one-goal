// app/components/ToastMessage.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';
import * as Tone from 'tone';

interface ToastMessageProps {
  message: string | null;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

// An inner component to manage the lifecycle of a single toast notification.
const SingleToast: React.FC<ToastMessageProps> = ({ message, type = 'info', duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const synth = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    // Initialize synth on client-side
    if (!synth.current) {
      synth.current = new Tone.Synth().toDestination();
    }
  }, []);

  useEffect(() => {
    // When the component mounts, make it visible and play a sound.
    const showTimeout = setTimeout(() => {
      setIsVisible(true);
      Tone.start();
      if (type === 'success') {
        synth.current?.triggerAttackRelease('C5', '0.2');
      } else if (type === 'error') {
        synth.current?.triggerAttackRelease('G2', '0.2');
      } else {
        synth.current?.triggerAttackRelease('E4', '0.2');
      }
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
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 p-4 rounded-xl shadow-xl z-[5000] text-white
            bg-black/50 backdrop-blur-md border ${config.borderColor}
            transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
            w-full max-w-sm sm:max-w-md`}
    >
      <div className="flex gap-3 items-center">
        <div className={`flex-shrink-0 p-2 rounded-lg ${config.iconBg}`}>{config.icon}</div>
        <div className="flex-grow leading-relaxed text-white/90">{message}</div>
        <button
          onClick={handleClose}
          className="ml-4 flex-shrink-0 p-1.5 rounded-lg transition-colors duration-200 cursor-pointer hover:bg-white/10 group"
          aria-label="Close notification"
        >
          <FiX className="w-5 h-5 text-neutral-400 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
};

// The main component now acts as a controller.
const ToastMessage: React.FC<ToastMessageProps> = ({ message, type = 'info', duration = 5000 }) => {
  const [toastKey, setToastKey] = useState(0);

  useEffect(() => {
    // If a new message is passed (even if it's the same string),
    // update the key. This tells React to create a new instance of SingleToast,
    // which will restart its animations and timers.
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
