// components/GoalModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { FiTarget, FiCalendar, FiX, FiInfo } from 'react-icons/fi';
import { MdRocketLaunch } from 'react-icons/md';

// Define a local interface for the goal data structure as used by this modal component.
// Dates are strings (ISO format) because dashboard/page.tsx transforms Timestamp to string
// before passing it to this modal for display/editing.
interface ModalGoalData {
  name: string;
  description?: string;
  startDate: string; // ISO string for dates
  endDate: string; // ISO string for dates
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetGoal: (goalName: string, endDate: string, description?: string) => void;
  initialGoalData?: ModalGoalData | null; // Now using ModalGoalData
  isEditMode?: boolean; // True if opened for editing
}

const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSetGoal,
  initialGoalData,
  isEditMode = false,
}) => {
  const [goalName, setGoalName] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // useRef to keep track of the initialGoalData that was last used to populate the form
  const lastInitialGoalData = useRef<ModalGoalData | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null); // Clear errors on open

      // Check if we are in edit mode and have initial data
      if (isEditMode && initialGoalData) {
        // Only update form fields if the initialGoalData has truly changed since last population
        // (comparing content using JSON.stringify for a simple deep comparison)
        const currentInitialDataString = JSON.stringify(initialGoalData);
        const lastDataInRefString = JSON.stringify(lastInitialGoalData.current);

        if (currentInitialDataString !== lastDataInRefString) {
          setGoalName(initialGoalData.name);
          setGoalDescription(initialGoalData.description || '');
          setEndDate(initialGoalData.endDate.slice(0, 16)); // Format for datetime-local
          lastInitialGoalData.current = initialGoalData; // Update ref with the new data
        }
      } else {
        // If not in edit mode (new goal), or initialGoalData is null, reset form
        setGoalName('');
        setGoalDescription('');
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(now.getHours() + 1);
        tomorrow.setMinutes(0);
        setEndDate(tomorrow.toISOString().slice(0, 16));
        lastInitialGoalData.current = null; // Clear ref as no initial data is being used
      }

      // Set minimum date for the datetime-local input
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      const minDate = now.toISOString().slice(0, 16);
      const endDateInput = document.getElementById('endDate') as HTMLInputElement;
      if (endDateInput) {
        endDateInput.min = minDate;
      }
    } else {
      // When modal closes, reset ref to ensure next open is fresh
      lastInitialGoalData.current = null;
    }
  }, [isOpen, isEditMode, initialGoalData]); // Dependencies remain the same

  const handleSubmit = () => {
    setErrorMessage(null);

    if (!goalName.trim()) {
      setErrorMessage('Goal name cannot be empty!');
      return;
    }
    if (!endDate) {
      setErrorMessage('Please select a target date and time!');
      return;
    }
    const goalEndDate = new Date(endDate);
    if (goalEndDate <= new Date()) {
      setErrorMessage('Target date must be in the future!');
      return;
    }
    onSetGoal(goalName, endDate, goalDescription.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.type !== 'textarea') {
      e.preventDefault(); // Prevent default form submission on enter in input fields
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="goalModal"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <div
        className={`bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 scale-95 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div className="flex gap-3 items-center">
            <FiTarget className="w-5 h-5 text-white" />
            <h2 className="text-xl font-semibold text-white">
              {isEditMode ? 'Update Goal' : 'Create New Goal'}
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
              <FiInfo className="mr-2 w-4 h-4" />
              {errorMessage}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="goalName" className="block mb-2 text-sm font-medium text-white/70">
                <FiTarget className="inline mr-1 w-4 h-4" />
                Goal Name <span className="text-red-400">*</span>
              </label>
              <input
                id="goalName"
                type="text"
                placeholder="e.g., Complete Project X"
                className="p-3 w-full text-base text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                value={goalName}
                onChange={e => setGoalName(e.target.value)}
                onKeyPress={handleKeyPress}
                required
              />
            </div>

            <div>
              <label
                htmlFor="goalDescription"
                className="block mb-2 text-sm font-medium text-white/70"
              >
                <FiInfo className="inline mr-1 w-4 h-4" />
                Goal Description (Optional)
              </label>
              <textarea
                id="goalDescription"
                placeholder="Describe your goal..."
                rows={3}
                className="p-3 w-full text-base text-white rounded-md border resize-y border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                value={goalDescription}
                onChange={e => setGoalDescription(e.target.value)}
                onKeyPress={handleKeyPress}
              ></textarea>
            </div>

            <div>
              <label htmlFor="endDate" className="block mb-2 text-sm font-medium text-white/70">
                <FiCalendar className="inline mr-1 w-4 h-4" />
                Target Date & Time <span className="text-red-400">*</span>
              </label>
              <input
                id="endDate"
                type="datetime-local"
                className="p-3 w-full text-base text-white rounded-md border border-white/10 bg-black/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                onKeyPress={handleKeyPress}
                required
              />
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Button */}
        <div className="p-6 border-t border-white/10">
          <button
            className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/30"
            onClick={handleSubmit}
          >
            <MdRocketLaunch className="w-5 h-5" />
            {isEditMode ? 'Update Goal' : 'Launch Goal'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalModal;
