// app/components/dashboard/DailyProgressModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiEdit3, FiCheckCircle, FiLoader, FiChevronDown } from 'react-icons/fi';
import { DailyProgress, SatisfactionLevel } from '@/types';
import { format } from 'date-fns';

interface DailyProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  initialProgress: DailyProgress | null;
  onSave: (progressData: Partial<DailyProgress>) => Promise<void>;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
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
  showMessage,
}) => {
  const [satisfaction, setSatisfaction] = useState<SatisfactionLevel>(SatisfactionLevel.MEDIUM);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSatisfaction(initialProgress?.satisfactionLevel || SatisfactionLevel.MEDIUM);
      setNotes(initialProgress?.progressNote || '');
    }
  }, [isOpen, initialProgress]);

  const handleSubmit = async () => {
    if (satisfaction === null) {
      showMessage('Please select a satisfaction level.', 'error');
      return;
    }
    setIsSubmitting(true);

    const progressData: Partial<DailyProgress> = {
      date: format(date, 'yyyy-MM-dd'),
      satisfactionLevel: satisfaction,
      progressNote: notes.trim(),
    };

    try {
      await onSave(progressData);
      onClose();
    } catch {
      showMessage('Failed to save daily progress.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
          <button className="p-1.5 text-white/60 rounded-full hover:bg-white/10" onClick={onClose}>
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
              <select
                value={satisfaction}
                onChange={e => setSatisfaction(Number(e.target.value) as SatisfactionLevel)}
                className="p-3 w-full text-base text-white rounded-md border appearance-none bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                {satisfactionOptions.map(option => (
                  <option key={option.level} value={option.level}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50" />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block mb-2 text-sm font-medium text-white/70">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any thoughts, challenges, or wins from today?"
              className="p-3 w-full text-base text-white rounded-md border resize-none bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>
        <div className="p-6 border-t border-white/10">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer hover:bg-white/90 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <FiLoader className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FiCheckCircle />
                <span>Save Progress</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyProgressModal;
