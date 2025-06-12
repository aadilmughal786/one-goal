// src/components/ConfirmationModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
// Removed import of ConfirmationModalProps, ModalButton from '@/types'

// Define a type for a single button in the modal
interface ModalButton {
  text: string;
  onClick: () => void;
  className?: string; // Optional custom classes for styling
  icon?: React.ReactNode; // Optional icon component
}

/**
 * Props for a generic confirmation modal.
 * Updated to support exactly two buttons: a primary action with optional delay, and a cancel.
 */
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title: string;
  confirmButton: ModalButton; // The primary action button (can be timed)
  cancelButton: ModalButton; // The cancel button (always immediate)
  actionDelayMs?: number; // Optional delay in milliseconds before the confirm button is enabled
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  message,
  title,
  confirmButton, // Now a single object
  cancelButton, // Now a single object
  actionDelayMs = 0, // Default to no delay
}) => {
  const [countdown, setCountdown] = useState(actionDelayMs / 1000);
  const [actionsEnabled, setActionsEnabled] = useState(actionDelayMs === 0);

  // Effect to manage the countdown timer for the confirm button
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && actionDelayMs > 0) {
      setActionsEnabled(false); // Disable actions initially
      setCountdown(prev => Math.max(0, actionDelayMs / 1000)); // Reset countdown, ensure non-negative
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setActionsEnabled(true); // Enable actions when countdown finishes
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (actionDelayMs === 0) {
      setActionsEnabled(true); // Enable actions immediately if no delay
    }

    // Cleanup interval on unmount or modal close
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, actionDelayMs]); // Re-run effect if modal opens or delay changes

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  // Handle clicks outside the modal content to close it
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    // Overlay for the modal
    <div
      className="flex fixed inset-0 z-40 justify-center items-center p-4 bg-black/50"
      onClick={handleOutsideClick}
      role="dialog" // ARIA role for dialog
      aria-modal="true" // ARIA attribute to indicate it's a modal dialog
      aria-labelledby="modal-title" // ARIA attribute to link to the title
      aria-describedby="modal-message" // ARIA attribute to link to the message
    >
      {/* Modal Content Box */}
      <div
        className="relative w-full max-w-sm text-center bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg
                   transform transition-all duration-300 scale-100 opacity-100 hover:bg-white/[0.06] hover:border-white/20"
        onClick={e => e.stopPropagation()} // Prevent clicks inside content from closing modal
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 mb-4 border-b border-white/10">
          <h3 id="modal-title" className="flex gap-2 items-center text-xl font-bold text-white">
            <FiAlertTriangle className="w-6 h-6 text-yellow-400" /> {title}
          </h3>
          {/* Close Button */}
          <button
            className="p-1 rounded-full transition-colors duration-200 cursor-pointer text-white/60 hover:text-white/90 hover:bg-white/10"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Message Body */}
          <p id="modal-message" className="mb-6 leading-relaxed text-left text-white/80">
            {message}
          </p>

          {/* Action Buttons */}
          {/* Cancel Button - always enabled */}
          <button
            className={`px-4 cursor-pointer w-full py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-white
              ${cancelButton.className || 'bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-white/20'}
            `}
            onClick={cancelButton.onClick}
          >
            {cancelButton.icon} {cancelButton.text}
          </button>

          {/* Confirm Button - timed disable */}
          <button
            className={`px-4 cursor-pointer w-full mt-3 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2
              ${confirmButton.className || 'bg-white text-black hover:bg-white/90 hover:scale-105'} // Default primary style
              ${!actionsEnabled ? 'opacity-50 cursor-not-allowed' : ''} // Disable styling
            `}
            onClick={() => {
              if (actionsEnabled) {
                confirmButton.onClick();
              }
            }}
            disabled={!actionsEnabled} // Disable button during countdown
          >
            {confirmButton.icon} {confirmButton.text}
            {/* Countdown Timer */}
            {actionDelayMs > 0 && <p className="text-sm font-semibold">( {countdown}s )</p>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
