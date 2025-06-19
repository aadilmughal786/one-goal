// app/components/ConfirmationModal.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FiAlertTriangle, FiX, FiLoader } from 'react-icons/fi';
import * as Tone from 'tone';

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
  const [isConfirming, setIsConfirming] = useState(false);
  const synth = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    // Initialize synth on client-side
    if (!synth.current) {
      synth.current = new Tone.Synth().toDestination();
    }
  }, []);

  // Effect to manage the countdown timer and play sound on open
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      // Play a sound to alert the user
      Tone.start();
      synth.current?.triggerAttackRelease('C4', '0.2');

      if (actionDelayMs > 0) {
        setActionsEnabled(false); // Disable actions initially
        setCountdown(Math.max(0, actionDelayMs / 1000)); // Reset countdown
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
      } else {
        setActionsEnabled(true); // Enable actions immediately if no delay
      }
    }

    // Cleanup interval on unmount or modal close
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, actionDelayMs]); // Re-run effect if modal opens or delay changes

  const handleConfirm = async () => {
    if (!actionsEnabled || isConfirming) return;
    setIsConfirming(true);
    try {
      await Promise.resolve(confirmButton.onClick());
    } finally {
      setIsConfirming(false);
    }
  };

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
      className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm bg-black/50"
      onClick={handleOutsideClick}
      role="dialog" // ARIA role for dialog
      aria-modal="true" // ARIA attribute to indicate it's a modal
      aria-labelledby="modal-title" // ARIA attribute to link to the title
      aria-describedby="modal-message" // ARIA attribute to link to the message
    >
      {/* Modal Content Box */}
      <div
        className="relative w-full max-w-sm text-center bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl"
        onClick={e => e.stopPropagation()} // Prevent clicks inside content from closing modal
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
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

        <div className="p-6">
          {/* Message Body */}
          <p id="modal-message" className="mb-6 leading-relaxed text-left text-white/80">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              className={`px-4 cursor-pointer w-full py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2
                  ${confirmButton.className || 'bg-red-600 text-white hover:bg-red-700'}
                  ${!actionsEnabled || isConfirming ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              onClick={handleConfirm}
              disabled={!actionsEnabled || isConfirming}
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
            <button
              className={
                'px-4 cursor-pointer w-full py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-white bg-white/[0.05] border border-white/10 hover:bg-white/10'
              }
              onClick={onClose}
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
