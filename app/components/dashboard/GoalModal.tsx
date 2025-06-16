// app/components/GoalModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FiTarget, FiCalendar, FiX, FiLoader } from 'react-icons/fi';
import { MdRocketLaunch } from 'react-icons/md';

interface ModalGoalData {
  name: string;
  description: string | null; // Changed to string | null
  startDate: string;
  endDate: string;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetGoal: (goalName: string, endDate: string, description: string | null) => Promise<void>; // Changed description to string | null
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  initialGoalData: ModalGoalData | null; // Changed from optional to explicit null
  isEditMode?: boolean;
}

const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSetGoal,
  showMessage,
  initialGoalData,
  isEditMode = false,
}) => {
  const [goalName, setGoalName] = useState('');
  const [goalDescription, setGoalDescription] = useState<string | null>(''); // State can be string or null
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialGoalData) {
        setGoalName(initialGoalData.name);
        setGoalDescription(initialGoalData.description); // Directly assign null/string
        setEndDate(initialGoalData.endDate.slice(0, 16));
      } else {
        setGoalName('');
        setGoalDescription(null); // Default to null for new goal
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        now.setDate(now.getDate() + 1);
        setEndDate(now.toISOString().slice(0, 16));
      }
    }
  }, [isOpen, isEditMode, initialGoalData]);

  const handleSubmit = async () => {
    if (!goalName.trim()) {
      showMessage('Goal name cannot be empty.', 'error');
      return;
    }
    if (!endDate) {
      showMessage('Please select a target date and time.', 'error');
      return;
    }
    if (new Date(endDate) <= new Date()) {
      showMessage('Target date and time must be in the future.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Pass goalDescription directly, it's already string | null
      await onSetGoal(goalName, endDate, goalDescription);
      // The parent component handles closing the modal and success message
    } catch (error) {
      showMessage((error as Error).message || 'An unknown error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const minDate = new Date();
  minDate.setMinutes(minDate.getMinutes() - minDate.getTimezoneOffset());

  return (
    <>
      <style>{`
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
            cursor: pointer;
        }
      `}</style>
      <div
        className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
        onClick={onClose}
      >
        <div
          className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl w-full max-w-md"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <div className="flex gap-3 items-center">
              <FiTarget className="w-5 h-5 text-white" />
              <h2 className="text-xl font-semibold text-white">
                {isEditMode ? 'Update Your Goal' : 'Set a New Goal'}
              </h2>
            </div>
            <button
              className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 focus:outline-none cursor-pointer"
              onClick={onClose}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="goalName" className="block mb-2 text-sm font-medium text-white/70">
                  Goal Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="goalName"
                  type="text"
                  placeholder="e.g., Complete Project Phoenix"
                  className="p-3 w-full text-base text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  value={goalName}
                  onChange={e => setGoalName(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="goalDescription"
                  className="block mb-2 text-sm font-medium text-white/70"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="goalDescription"
                  placeholder="Describe what success looks like..."
                  rows={3}
                  className="p-3 w-full text-base text-white rounded-md border resize-none border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  value={goalDescription || ''} // Handle null for textarea value
                  onChange={e => setGoalDescription(e.target.value === '' ? null : e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block mb-2 text-sm font-medium text-white/70">
                  <FiCalendar className="inline -mt-1 mr-1" /> Target Date & Time{' '}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  id="endDate"
                  type="datetime-local"
                  className="p-3 w-full text-base text-white rounded-md border cursor-pointer border-white/10 bg-black/20 focus:outline-none focus:ring-2 focus:ring-white/30 accent-white"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  min={minDate.toISOString().slice(0, 16)}
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/10">
            <button
              className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <MdRocketLaunch className="w-5 h-5" />
                  <span>{isEditMode ? 'Update Goal' : 'Launch Goal'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GoalModal;
