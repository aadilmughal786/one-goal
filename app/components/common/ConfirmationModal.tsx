// app/components/common/ConfirmationModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiLoader, FiTrash2, FiX } from 'react-icons/fi';

import { useNotificationStore } from '@/store/useNotificationStore';

const ConfirmationModal: React.FC = () => {
  const {
    isOpen,
    title,
    message,
    action,
    actionDelayMs = 0,
  } = useNotificationStore(state => state.confirmation);
  const hideConfirmation = useNotificationStore(state => state.hideConfirmation);

  const [countdown, setCountdown] = useState(actionDelayMs / 1000);
  const [actionsEnabled, setActionsEnabled] = useState(actionDelayMs === 0);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isOpen) {
      if (actionDelayMs > 0) {
        setActionsEnabled(false);
        setCountdown(Math.max(0, actionDelayMs / 1000));
        timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              setActionsEnabled(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setActionsEnabled(true);
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, actionDelayMs]);

  const handleConfirm = async () => {
    if (!actionsEnabled || isConfirming) return;
    setIsConfirming(true);
    try {
      await Promise.resolve(action());
    } finally {
      setIsConfirming(false);
      hideConfirmation();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="flex fixed inset-0 z-[5000] justify-center items-center p-4 backdrop-blur-sm cursor-pointer bg-black/50"
      onClick={hideConfirmation}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-sm text-center rounded-md border shadow-2xl backdrop-blur-md cursor-auto bg-bg-secondary border-border-primary"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary">
          <h3 className="flex gap-2 items-center text-xl font-bold text-text-primary">
            <FiAlertTriangle className="w-6 h-6 text-yellow-400" /> {title}
          </h3>
          <button
            onClick={hideConfirmation}
            className="p-1.5 rounded-full transition-colors duration-200 cursor-pointer text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="mb-6 leading-relaxed text-left text-text-secondary">{message}</p>
          <div className="flex flex-col gap-3">
            <button
              className={`px-4 w-full py-3 rounded-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer bg-red-600 text-white hover:bg-red-700
                ${!actionsEnabled || isConfirming ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleConfirm}
              disabled={!actionsEnabled || isConfirming}
            >
              {isConfirming ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiTrash2 />}
              {isConfirming ? 'Confirming...' : 'Confirm'}
              {actionDelayMs > 0 && !actionsEnabled && (
                <span className="text-sm font-semibold">({countdown}s)</span>
              )}
            </button>
            <button
              onClick={hideConfirmation}
              className={
                'flex gap-2 justify-center items-center px-4 py-3 w-full rounded-md border transition-all duration-300 cursor-pointer text-text-primary bg-bg-tertiary border-border-primary hover:bg-border-primary'
              }
            >
              <FiX /> Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
