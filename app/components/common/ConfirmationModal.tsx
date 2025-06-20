// app/components/common/ConfirmationModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiX, FiLoader } from 'react-icons/fi';

// Define a type for a single button in the modal
interface ModalButton {
  text: string;
  onClick: () => void; // Function to be executed when the button is clicked
  className?: string; // Optional custom classes for styling the button
  icon?: React.ReactNode; // Optional icon component to display next to the text
}

/**
 * Props for a generic confirmation modal.
 * Designed to support exactly two buttons: a primary action (confirm) and a secondary (cancel).
 */
interface ConfirmationModalProps {
  isOpen: boolean; // Controls whether the modal is visible
  onClose: () => void; // Callback function to close the modal
  message: string; // The main message displayed in the modal body
  title: string; // The title of the modal, displayed in the header
  confirmButton: ModalButton; // Configuration for the primary action button
  cancelButton: ModalButton; // Configuration for the cancel button
  actionDelayMs?: number; // Optional delay in milliseconds before the confirm button is enabled (e.g., for destructive actions)
}

/**
 * ConfirmationModal Component
 *
 * A reusable, generic modal component for displaying confirmation dialogs.
 * It supports a configurable title, message, two action buttons (confirm and cancel),
 * and an optional delay before the confirm button becomes active.
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  message,
  title,
  confirmButton,
  cancelButton,
  actionDelayMs = 0, // Default to no delay if not provided
}) => {
  // State for the countdown timer (in seconds) before the confirm button is enabled
  const [countdown, setCountdown] = useState(actionDelayMs / 1000);
  // State to track if action buttons (specifically confirm) are enabled
  const [actionsEnabled, setActionsEnabled] = useState(actionDelayMs === 0);
  // State to indicate if the confirmation action is currently in progress (e.g., API call)
  const [isConfirming, setIsConfirming] = useState(false);

  // Effect to manage the countdown timer.
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined; // Declare timer variable with type
    if (isOpen) {
      if (actionDelayMs > 0) {
        setActionsEnabled(false); // Disable actions initially if there's a delay
        setCountdown(Math.max(0, actionDelayMs / 1000)); // Reset countdown to initial value
        timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer); // Stop the timer when countdown reaches 1 or less
              setActionsEnabled(true); // Enable actions
              return 0; // Set countdown to 0
            }
            return prev - 1; // Decrement countdown
          });
        }, 1000); // Update every second
      } else {
        setActionsEnabled(true); // Enable actions immediately if no delay
      }
    }

    // Cleanup function to clear the interval when the modal closes or component unmounts.
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, actionDelayMs]); // Re-run effect if modal opens/closes or delay changes

  /**
   * Handles the click event for the confirm button.
   * Disables the button during the action and re-enables it afterwards.
   */
  const handleConfirm = async () => {
    if (!actionsEnabled || isConfirming) return; // Prevent action if not enabled or already confirming
    setIsConfirming(true); // Set confirming state to true
    try {
      // Execute the provided onClick function, ensuring it's treated as a Promise
      await Promise.resolve(confirmButton.onClick());
    } finally {
      setIsConfirming(false); // Reset confirming state regardless of success or failure
      // Note: The modal is typically closed by the parent component's `action` callback,
      // which is invoked by `confirmButton.onClick()`.
    }
  };

  // If modal is not open, don't render anything to optimize performance.
  if (!isOpen) return null;

  /**
   * Handles clicks outside the modal content to close it.
   * Ensures clicks on the modal content itself do not close it.
   */
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If the click target is the overlay itself (not a child element), close the modal
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    // Overlay for the modal: fixed position, covers screen, centers content, blurred background
    <div
      className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm bg-black/50"
      onClick={handleOutsideClick}
      role="dialog" // ARIA role for dialog
      aria-modal="true" // ARIA attribute to indicate it's a modal dialog
      aria-labelledby="modal-title" // ARIA attribute to link to the title for screen readers
      aria-describedby="modal-message" // ARIA attribute to link to the message for screen readers
    >
      {/* Modal Content Box: responsive width, styled background, rounded corners, shadow */}
      <div
        className="relative w-full max-w-sm text-center bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl"
        // Prevent clicks inside content from bubbling up and closing modal
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          {/* Title with warning icon */}
          <h3 id="modal-title" className="flex gap-2 items-center text-xl font-bold text-white">
            <FiAlertTriangle className="w-6 h-6 text-yellow-400" /> {title}
          </h3>
          {/* Close button */}
          <button
            className="p-1.5 rounded-full transition-colors duration-200 cursor-pointer text-white/60 hover:text-white hover:bg-white/10"
            onClick={onClose}
            aria-label="Close modal" // Accessibility label
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Message text */}
          <p id="modal-message" className="mb-6 leading-relaxed text-left text-white/80">
            {message}
          </p>

          {/* Action Buttons Container */}
          <div className="flex flex-col gap-3">
            {/* Confirm Button */}
            <button
              className={`px-4 cursor-pointer w-full py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2
                  ${confirmButton.className || 'bg-red-600 text-white hover:bg-red-700'}
                  ${!actionsEnabled || isConfirming ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              onClick={handleConfirm}
              disabled={!actionsEnabled || isConfirming} // Disable based on delay and confirming state
              aria-label={isConfirming ? 'Confirming action' : confirmButton.text} // Accessibility label
            >
              {isConfirming ? (
                // Display loader when confirming
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  <span>Confirming...</span>
                </>
              ) : (
                // Display icon, text, and countdown if not confirming
                <>
                  {confirmButton.icon} {confirmButton.text}
                  {actionDelayMs > 0 && !actionsEnabled && (
                    // Show countdown if delay is active and actions are not yet enabled
                    <span className="text-sm font-semibold">({countdown}s)</span>
                  )}
                </>
              )}
            </button>
            {/* Cancel Button */}
            <button
              className={
                'px-4 cursor-pointer w-full py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-white bg-white/[0.05] border border-white/10 hover:bg-white/10'
              }
              onClick={onClose}
              aria-label={cancelButton.text} // Accessibility label
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
