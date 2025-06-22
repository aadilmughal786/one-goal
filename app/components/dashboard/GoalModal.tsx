// app/components/dashboard/GoalModal.tsx
'use client';

import { DateTimePicker } from '@/components/common/DateTimePicker'; // Import the new component
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { FiCalendar, FiLoader, FiTarget, FiX } from 'react-icons/fi';
import { MdRocketLaunch } from 'react-icons/md';
// NEW: Import useNotificationStore to use showToast
import { useNotificationStore } from '@/store/useNotificationStore';

interface ModalGoalData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetGoal: (goalName: string, endDate: Date, description: string) => Promise<void>;
  // REMOVED: showMessage is now handled internally via useNotificationStore, so it's removed from props
  initialGoalData: ModalGoalData | null;
  isEditMode?: boolean;
}

const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSetGoal,
  initialGoalData,
  isEditMode = false,
}) => {
  const [goalName, setGoalName] = useState('');
  const [goalDescription, setGoalDescription] = useState<string>('');
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NEW: Access showToast from the global notification store
  const showToast = useNotificationStore(state => state.showToast);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialGoalData) {
        setGoalName(initialGoalData.name);
        setGoalDescription(initialGoalData.description);
        setEndDate(new Date(initialGoalData.endDate));
      } else {
        setGoalName('');
        setGoalDescription('');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setEndDate(tomorrow);
      }
    }
  }, [isOpen, isEditMode, initialGoalData]);

  const handleSubmit = async () => {
    if (!goalName.trim()) {
      showToast('Goal name cannot be empty.', 'error'); // Use global showToast
      return;
    }
    if (!endDate) {
      showToast('Please select a target date and time.', 'error'); // Use global showToast
      return;
    }
    if (endDate <= new Date()) {
      showToast('Target date and time must be in the future.', 'error'); // Use global showToast
      return;
    }

    setIsSubmitting(true);
    try {
      await onSetGoal(goalName, endDate, goalDescription);
    } catch (error) {
      showToast((error as Error).message || 'An unknown error occurred.', 'error'); // Use global showToast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
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
                  value={goalDescription || ''}
                  onChange={e => setGoalDescription(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block mb-2 text-sm font-medium text-white/70">
                  <FiCalendar className="inline -mt-1 mr-1" /> Target Date & Time{' '}
                  <span className="text-red-400">*</span>
                </label>
                <button
                  onClick={() => setIsPickerOpen(true)}
                  className="p-3 w-full text-base text-left text-white rounded-md border bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  {endDate ? (
                    format(endDate, "MMMM d,yyyy 'at' h:mm a")
                  ) : (
                    <span className="text-white/50">Set a deadline</span>
                  )}
                </button>
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
      <DateTimePicker
        isOpen={isPickerOpen}
        value={endDate}
        onChange={setEndDate}
        onClose={() => setIsPickerOpen(false)}
        mode="datetime"
      />
    </>
  );
};

export default GoalModal;
