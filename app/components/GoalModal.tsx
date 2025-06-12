// components/GoalModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FiTarget, FiCalendar, FiX, FiInfo } from 'react-icons/fi';
import { MdRocketLaunch } from 'react-icons/md';
import { GoalData } from '@/types'; // Import GoalData type

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetGoal: (goalName: string, endDate: string, description?: string) => void;
  initialGoalData?: GoalData | null; // Data to pre-fill in edit mode
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

  // Effect to populate form fields when in edit mode or reset for new goal
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null); // Clear errors on open
      if (isEditMode && initialGoalData) {
        setGoalName(initialGoalData.name);
        setGoalDescription(initialGoalData.description || '');

        // Handle endDate: Ensure it's in "YYYY-MM-DDTHH:MM" format
        let formattedEndDate = '';
        if (initialGoalData.endDate instanceof Date) {
          formattedEndDate = initialGoalData.endDate.toISOString().slice(0, 16);
        } else if (typeof initialGoalData.endDate === 'string') {
          // If it's already an ISO string, ensure it's trimmed to the correct format
          formattedEndDate = initialGoalData.endDate.slice(0, 16);
        } else if ((initialGoalData.endDate as any).toDate) {
          // Check if it's a Firestore Timestamp
          formattedEndDate = (initialGoalData.endDate as any).toDate().toISOString().slice(0, 16);
        }
        setEndDate(formattedEndDate);
      } else {
        // Reset form fields when opening for new goal
        setGoalName('');
        setGoalDescription('');
        // Set default end date to tomorrow for convenience when creating new
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Adjust for timezone
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(now.getHours() + 1); // Suggest 1 hour from now, or tomorrow
        tomorrow.setMinutes(0); // Round minutes to 0
        setEndDate(tomorrow.toISOString().slice(0, 16));
      }

      // Set minimum date for the datetime-local input
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      const minDate = now.toISOString().slice(0, 16);
      const endDateInput = document.getElementById('endDate') as HTMLInputElement;
      if (endDateInput) {
        endDateInput.min = minDate;
      }
    }
  }, [isOpen, isEditMode, initialGoalData]);

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

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
      setErrorMessage(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="goalModal" className="modal show" onClick={handleOutsideClick}>
      <div className="modal-content">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-3 items-center">
              <FiTarget className="w-6 h-6 text-gray-800" />
              <h2 className="text-2xl font-bold text-gray-800">
                {isEditMode ? 'Update Goal' : 'Create New Goal'}
              </h2>
            </div>
            <button
              className="p-1 text-gray-500 rounded-full hover:text-gray-700 hover:bg-gray-100"
              onClick={onClose}
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {errorMessage && (
            <div className="flex items-center p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-400">
              <FiInfo className="mr-2 w-4 h-4" />
              {errorMessage}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="goalName" className="block mb-2 text-sm font-medium text-gray-700">
                <FiTarget className="inline mr-1 w-4 h-4" />
                Goal Name <span className="text-red-500">*</span>
              </label>
              <input
                id="goalName"
                type="text"
                placeholder="e.g., Complete Marathon Training"
                className="p-3 w-full text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={goalName}
                onChange={e => setGoalName(e.target.value)}
                onKeyPress={handleKeyPress}
                required
              />
            </div>

            <div>
              <label
                htmlFor="goalDescription"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                <FiInfo className="inline mr-1 w-4 h-4" />
                Goal Description (Optional)
              </label>
              <textarea
                id="goalDescription"
                placeholder="Briefly describe your goal and why it matters..."
                rows={3}
                className="p-3 w-full text-lg rounded-lg border border-gray-300 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={goalDescription}
                onChange={e => setGoalDescription(e.target.value)}
                onKeyPress={handleKeyPress}
              ></textarea>
            </div>

            <div>
              <label htmlFor="endDate" className="block mb-2 text-sm font-medium text-gray-700">
                <FiCalendar className="inline mr-1 w-4 h-4" />
                Target Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                id="endDate"
                type="datetime-local"
                className="p-3 w-full text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                onKeyPress={handleKeyPress}
                required
              />
            </div>

            <button
              className="flex gap-2 justify-center items-center py-3 w-full text-lg btn-primary"
              onClick={handleSubmit}
            >
              <MdRocketLaunch className="w-5 h-5" />
              {isEditMode ? 'Update Goal' : 'Launch Goal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalModal;
