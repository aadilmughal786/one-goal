// app/components/common/ConfirmationModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiLoader, FiX } from 'react-icons/fi';

// =================================================================//
//
// INTERFACES
//
// =================================================================//

/**
 * Defines the configuration for a button within the modal.
 * This allows for flexible text, styling, and actions.
 */
interface ModalButton {
  /** The text displayed on the button. */
  text: string;
  /** The function to execute when the button is clicked. */
  onClick: () => void;
  /** Optional custom Tailwind CSS classes for styling. */
  className?: string;
  /** An optional icon component to display next to the text. */
  icon?: React.ReactNode;
}

/**
 * Defines the props for the reusable ConfirmationModal component.
 */
interface ConfirmationModalProps {
  /** Controls whether the modal is visible. */
  isOpen: boolean;
  /** A callback function to close the modal. */
  onClose: () => void;
  /** The main message or description displayed in the modal body. */
  message: string;
  /** The title displayed in the modal header. */
  title: string;
  /** The configuration for the primary action button (e.g., "Confirm", "Delete"). */
  confirmButton: ModalButton;
  /** The configuration for the secondary action button (e.g., "Cancel"). */
  cancelButton: ModalButton;
  /** An optional delay in milliseconds before the confirm button becomes active.
   * Useful for destructive actions to prevent accidental clicks. */
  actionDelayMs?: number;
}

// =================================================================//
//
// COMPONENT IMPLEMENTATION
//
// =================================================================//

/**
 * A generic, reusable modal component for displaying confirmation dialogs.
 * It is designed to be highly configurable for various use cases like deletion,
 * data import overwrites, or any action requiring user confirmation.
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  message,
  title,
  confirmButton,
  cancelButton,
  actionDelayMs = 0,
}) => {
  // =================================================================//
  //
  // STATE MANAGEMENT
  //
  // =================================================================//

  /** State to manage the countdown timer (in seconds) before the confirm button is enabled. */
  const [countdown, setCountdown] = useState(actionDelayMs / 1000);
  /** State to track if action buttons are enabled, primarily used for the confirm button delay. */
  const [actionsEnabled, setActionsEnabled] = useState(actionDelayMs === 0);
  /** State to indicate if the confirmation action is currently in progress (e.g., an API call). */
  const [isConfirming, setIsConfirming] = useState(false);

  // =================================================================//
  //
  // LIFECYCLE & SYNCHRONIZATION
  //
  // =================================================================//

  /**
   * Effect to manage the countdown timer for the action delay.
   * It runs whenever the modal is opened or the delay value changes.
   */
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
    // Cleanup function to clear the interval when the modal closes or component unmounts.
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, actionDelayMs]);

  // =================================================================//
  //
  // EVENT HANDLERS
  //
  // =================================================================//

  /**
   * Handles the click event for the confirm button. Sets a loading state
   * and executes the provided onClick action.
   */
  const handleConfirm = async () => {
    if (!actionsEnabled || isConfirming) return;
    setIsConfirming(true);
    try {
      await Promise.resolve(confirmButton.onClick());
    } finally {
      setIsConfirming(false);
      // The modal is typically closed by the parent's `action` callback.
    }
  };

  /**
   * Handles clicks on the modal overlay to close it.
   * Clicks on the modal content itself are ignored.
   */
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // =================================================================//
  //
  // MAIN RENDER
  //
  // =================================================================//

  if (!isOpen) return null;

  return (
    <div
      className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm cursor-pointer bg-black/50"
      onClick={handleOutsideClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-message"
    >
      <div
        className="relative w-full max-w-sm text-center bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-md shadow-2xl cursor-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
          <h3 id="modal-title" className="flex gap-2 items-center text-xl font-bold text-white">
            <FiAlertTriangle className="w-6 h-6 text-yellow-400" /> {title}
          </h3>
          <button
            className="p-1.5 rounded-full transition-colors duration-200 cursor-pointer text-white/60 hover:text-white hover:bg-white/10"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <p id="modal-message" className="mb-6 leading-relaxed text-left text-white/80">
            {message}
          </p>

          {/* Action Buttons Container */}
          <div className="flex flex-col gap-3">
            {/* Confirm Button */}
            <button
              className={`px-4 w-full py-3 rounded-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer
                ${confirmButton.className || 'bg-red-600 text-white hover:bg-red-700'}
                ${!actionsEnabled || isConfirming ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={handleConfirm}
              disabled={!actionsEnabled || isConfirming}
              aria-label={isConfirming ? 'Confirming action' : confirmButton.text}
            >
              {isConfirming ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  <span>Confirming...</span>
                </>
              ) : (
                <>
                  {confirmButton.icon} {confirmButton.text}
                  {actionDelayMs > 0 && !actionsEnabled && (
                    <span className="text-sm font-semibold">({countdown}s)</span>
                  )}
                </>
              )}
            </button>
            {/* Cancel Button */}
            <button
              className={
                'px-4 w-full py-3 rounded-md transition-all duration-300 flex items-center justify-center gap-2 text-white bg-white/[0.05] border border-white/10 hover:bg-white/10 cursor-pointer'
              }
              onClick={onClose}
              aria-label={cancelButton.text}
            >
              {cancelButton.icon} {cancelButton.text}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
