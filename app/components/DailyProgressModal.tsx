// app/components/DailyProgressModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiCheckCircle, FiEdit3 } from 'react-icons/fi';
import { DailyProgress } from '@/types';
import { Timestamp } from 'firebase/firestore';

interface DailyProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null; // The date for which progress is being recorded
  initialProgress?: DailyProgress | null; // Existing progress for editing
  onSave: (date: Date, satisfactionLevel: number, notes?: string) => void;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

const satisfactionLevels = [
  { level: 1, label: 'Very Low', color: 'bg-red-500' },
  { level: 2, label: 'Low', color: 'bg-orange-500' },
  { level: 3, label: 'Medium', color: 'bg-yellow-500' },
  { level: 4, label: 'High', color: 'bg-lime-500' },
  { level: 5, label: 'Very High', color: 'bg-green-500' },
];

const DailyProgressModal: React.FC<DailyProgressModalProps> = ({
  isOpen,
  onClose,
  date,
  initialProgress,
  onSave,
  showMessage,
}) => {
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && date) {
      // Set initial values if editing, otherwise reset
      setSatisfaction(initialProgress?.satisfactionLevel || null);
      setNotes(initialProgress?.notes || '');
      setErrorMessage(null); // Clear errors on open
    }
  }, [isOpen, date, initialProgress]);

  const handleSubmit = () => {
    setErrorMessage(null);
    if (!date) {
      setErrorMessage('No date selected for progress.');
      return;
    }
    if (satisfaction === null) {
      setErrorMessage('Please select a satisfaction level.');
      return;
    }

    onSave(date, satisfaction, notes.trim());
    // onClose will be called by the parent after save is successful
  };

  if (!isOpen || !date) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <div
        className={`bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 scale-95 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div className="flex gap-3 items-center">
            <FiEdit3 className="w-5 h-5 text-white" />
            <h2 className="text-xl font-semibold text-white">
              Progress for{' '}
              {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
          </div>
          <button
            className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            onClick={onClose}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="flex items-center p-3 mb-4 text-sm text-red-400 rounded-md border border-red-400 bg-red-500/10">
              {errorMessage}
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-white/70">
              Work Satisfaction Level
            </label>
            <div className="flex flex-wrap gap-2">
              {satisfactionLevels.map(option => (
                <button
                  key={option.level}
                  type="button"
                  onClick={() => setSatisfaction(option.level)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${option.color} ${option.level === satisfaction ? 'ring-2 ring-offset-2 ring-white scale-105' : 'hover:scale-105 opacity-80 hover:opacity-100'}
                    ${option.level === satisfaction ? 'text-black' : 'text-white'}
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block mb-2 text-sm font-medium text-white/70">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              className="p-3 w-full text-base text-white rounded-md border resize-y border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
              placeholder="Add any thoughts or details about today's progress..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            ></textarea>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 justify-end p-6 border-t border-white/10">
          <button
            type="button"
            className="px-6 py-3 text-white rounded-full transition-all duration-200 bg-white/10 hover:bg-white/20"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex gap-2 items-center px-6 py-3 font-semibold text-black bg-white rounded-full transition-all duration-200 hover:bg-white/90 hover:scale-105"
            onClick={handleSubmit}
          >
            <FiCheckCircle className="w-5 h-5" /> Save Progress
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyProgressModal;
