// app/components/dashboard/DailyProgressModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiEdit3, FiCheckCircle, FiLoader, FiChevronDown } from 'react-icons/fi';
import { DailyProgress, SatisfactionLevel, StopwatchSession } from '@/types'; // Import StopwatchSession
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

interface DailyProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  initialProgress: DailyProgress | null; // Changed to non-optional as it's either data or null for new
  onSave: (progressData: DailyProgress) => Promise<void>;
}

const satisfactionOptions = [
  { level: SatisfactionLevel.VERY_LOW, label: 'Very Low', color: 'bg-red-500' },
  { level: SatisfactionLevel.LOW, label: 'Low', color: 'bg-orange-500' },
  { level: SatisfactionLevel.MEDIUM, label: 'Medium', color: 'bg-yellow-500' },
  { level: SatisfactionLevel.HIGH, label: 'High', color: 'bg-lime-500' },
  { level: SatisfactionLevel.VERY_HIGH, label: 'Very High', color: 'bg-green-500' },
];

const DailyProgressModal: React.FC<DailyProgressModalProps> = ({
  isOpen,
  onClose,
  date,
  initialProgress,
  onSave,
}) => {
  const [satisfaction, setSatisfaction] = useState<SatisfactionLevel | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Initialize state based on initialProgress
  useEffect(() => {
    if (isOpen) {
      setSatisfaction(initialProgress?.satisfactionLevel || null); // Ensure null default if not present
      setNotes(initialProgress?.progressNote || '');
      setIsDropdownOpen(false);
    }
  }, [isOpen, initialProgress]);

  // Prevent scrolling body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleSubmit = async () => {
    if (satisfaction === null) {
      // Replaced alert with a more user-friendly message or toast if available
      // For now, let's log to console or use a temporary state for a message.
      console.error('Please select a satisfaction level.');
      // If you have a ToastMessage component available, you could use:
      // showMessage('Please select a satisfaction level.', 'error');
      return;
    }
    setIsSubmitting(true);

    // Prepare stopwatchSessions. If initialProgress exists, use its sessions; otherwise, an empty array.
    const currentStopwatchSessions: StopwatchSession[] = initialProgress?.stopwatchSessions || [];

    const progressData: DailyProgress = {
      date: format(date, 'yyyy-MM-dd'), // Date string as per DailyProgress interface
      satisfactionLevel: satisfaction,
      progressNote: notes.trim(),
      stopwatchSessions: currentStopwatchSessions, // Pass existing sessions
      effortTimeMinutes: initialProgress?.effortTimeMinutes || 0, // Initial value, will be re-calculated by service
      createdAt: initialProgress?.createdAt || Timestamp.now(), // Preserve existing creation time or set new
      updatedAt: Timestamp.now(),
    };

    try {
      await onSave(progressData);
      // Parent component is expected to handle success message and modal close.
    } catch (error) {
      console.error('Failed to save daily progress:', error);
      // If you have a ToastMessage component available, you could use:
      // showMessage('Failed to save daily progress.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedOption = satisfactionOptions.find(opt => opt.level === satisfaction);

  return (
    <div
      className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            Log Progress for {format(date, 'MMMM d, yyyy')}
          </h2>
          <button
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-white/70">
              <FiEdit3 className="inline -mt-1 mr-1" />
              Satisfaction Level
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex justify-between items-center px-4 py-3 w-full text-lg text-left text-white rounded-md border cursor-pointer border-white/10 bg-black/20 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                {selectedOption ? (
                  <span className="flex gap-3 items-center">
                    <div className={`w-3 h-3 rounded-full ${selectedOption.color}`}></div>
                    {selectedOption.label}
                  </span>
                ) : (
                  <span className="text-white/50">Select a level...</span>
                )}
                <FiChevronDown
                  className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isDropdownOpen && (
                <div className="absolute z-10 p-2 mt-2 w-full rounded-lg border shadow-lg bg-neutral-900 border-white/10">
                  {satisfactionOptions.map(option => (
                    <button
                      key={option.level}
                      onClick={() => {
                        setSatisfaction(option.level);
                        setIsDropdownOpen(false);
                      }}
                      className="flex gap-3 items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer hover:bg-white/10"
                    >
                      <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Removed Time Spent (minutes) input as it's derived from stopwatch sessions */}
          <div>
            <label htmlFor="notes" className="block mb-2 text-sm font-medium text-white/70">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any thoughts or blockers?"
              className="p-3 w-full text-base text-white rounded-md border resize-none border-white/10 bg-black/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>
        <div className="p-6 border-t border-white/10">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer hover:bg-white/90 disabled:opacity-60"
          >
            {isSubmitting ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}
            Save Progress
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyProgressModal;
