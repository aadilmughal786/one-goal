// app/components/common/ConfirmationModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiLoader, FiTrash2, FiX } from 'react-icons/fi';

// --- REFLECTING THE REFACTOR ---
// We now import the Zustand store to get the modal's state and actions.
import { useNotificationStore } from '@/store/useNotificationStore';

/**
 * A generic, reusable modal for confirmation dialogs.
 * It is now fully controlled by the `useNotificationStore`, removing the need
 * for any props to be passed to it. It is rendered once in the root layout.
 */
const ConfirmationModal: React.FC = () => {
  // Select the state and actions for this component from the notification store.
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
      hideConfirmation(); // Close modal via store action
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
        className="relative w-full max-w-sm text-center bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-md shadow-2xl cursor-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
          <h3 className="flex gap-2 items-center text-xl font-bold text-white">
            <FiAlertTriangle className="w-6 h-6 text-yellow-400" /> {title}
          </h3>
          <button
            onClick={hideConfirmation}
            className="p-1.5 rounded-full transition-colors duration-200 cursor-pointer text-white/60 hover:text-white hover:bg-white/10"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="mb-6 leading-relaxed text-left text-white/80">{message}</p>
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
                'px-4 w-full py-3 rounded-md transition-all duration-300 flex items-center justify-center gap-2 text-white bg-white/[0.05] border border-white/10 hover:bg-white/10 cursor-pointer'
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
