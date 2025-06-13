// app/components/dashboard/DailyProgressModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiClock, FiEdit3, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { DailyProgress, SatisfactionLevel } from '@/types';
import { Timestamp } from 'firebase/firestore';

interface DailyProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  initialProgress?: DailyProgress | null;
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
  const [timeSpent, setTimeSpent] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSatisfaction(initialProgress?.satisfactionLevel ?? null);
      setTimeSpent(String(initialProgress?.timeSpentMinutes ?? ''));
      setNotes(initialProgress?.notes ?? '');
    }
  }, [isOpen, initialProgress]);

  const handleSubmit = async () => {
    if (satisfaction === null) {
      // Basic validation, can be enhanced with a toast message from parent
      alert('Please select a satisfaction level.');
      return;
    }
    setIsSubmitting(true);
    const progressData: DailyProgress = {
      date: Timestamp.fromDate(date),
      satisfactionLevel: satisfaction,
      timeSpentMinutes: Number(timeSpent) || 0,
      notes: notes.trim(),
    };
    await onSave(progressData);
    setIsSubmitting(false);
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
            Log Progress for {date.toLocaleDateString()}
          </h2>
          <button
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-white/70">
              <FiEdit3 className="inline -mt-1 mr-1" />
              Satisfaction Level
            </label>
            <div className="flex flex-wrap gap-2">
              {satisfactionOptions.map(option => (
                <button
                  key={option.level}
                  onClick={() => setSatisfaction(option.level)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${satisfaction === option.level ? `${option.color} text-black ring-2 ring-offset-2 ring-offset-neutral-800 ring-white` : 'bg-white/10 hover:bg-white/20'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="timeSpent" className="block mb-2 text-sm font-medium text-white/70">
              <FiClock className="inline -mt-1 mr-1" />
              Time Spent (minutes)
            </label>
            <input
              id="timeSpent"
              type="number"
              value={timeSpent}
              onChange={e => setTimeSpent(e.target.value)}
              placeholder="e.g., 60"
              className="p-3 w-full text-base text-white rounded-md border border-white/10 bg-black/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
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
