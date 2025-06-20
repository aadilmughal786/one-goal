// app/components/routine/ScheduleEditModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiLoader, FiCheck } from 'react-icons/fi';
import {
  MdOutlineSettings,
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowUp,
} from 'react-icons/md';
import { ScheduledRoutineBase } from '@/types'; // Ensure correct import of ScheduledRoutineBase
import { format, parse } from 'date-fns';
import { DateTimePicker } from '@/components/common/DateTimePicker'; // Import the new component
import { Timestamp } from 'firebase/firestore'; // Import Timestamp for new schedule creation

interface ScheduleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleToEdit: ScheduledRoutineBase | null; // The routine object being edited
  originalIndex: number | null; // Its original index in the array, for updates
  onSave: (schedule: ScheduledRoutineBase, originalIndex: number | null) => Promise<void>;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  newInputLabelPlaceholder: string;
  newIconOptions: string[]; // Array of icon names (strings)
  iconComponentsMap: { [key: string]: React.ElementType }; // Map from icon name to React component
  buttonLabel: string; // Label for the save button (e.g., "Add Routine", "Save Changes")
}

// Helper for generating UUIDs for new item IDs
const generateUUID = () => crypto.randomUUID();

const ScheduleEditModal: React.FC<ScheduleEditModalProps> = ({
  isOpen,
  onClose,
  scheduleToEdit,
  originalIndex,
  onSave,
  showMessage,
  newInputLabelPlaceholder,
  newIconOptions,
  iconComponentsMap,
  buttonLabel,
}) => {
  const [label, setLabel] = useState('');
  // Changed to 'time' to match ScheduledRoutineBase
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  // Changed to 'duration' to match ScheduledRoutineBase
  const [duration, setDuration] = useState<number | ''>(30);
  const [icon, setIcon] = useState(newIconOptions[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false); // State for the time picker
  const iconDropdownRef = useRef<HTMLDivElement>(null);

  // Effect to initialize or reset form fields when the modal opens or `scheduleToEdit` changes.
  useEffect(() => {
    if (isOpen) {
      if (scheduleToEdit) {
        // If editing an existing schedule, populate fields with its data
        setLabel(scheduleToEdit.label);
        setTime(scheduleToEdit.time); // Use 'time' property
        setDuration(scheduleToEdit.duration); // Use 'duration' property
        setIcon(scheduleToEdit.icon);
      } else {
        // If adding a new schedule, reset fields to default/empty
        setLabel('');
        setTime(format(new Date(), 'HH:mm')); // Default to current time
        setDuration(30); // Default duration
        setIcon(newIconOptions[0]); // Default icon
      }
      setIsSubmitting(false); // Reset submission state
      setIsIconDropdownOpen(false); // Close dropdown on open
      setIsTimePickerOpen(false); // Close time picker on open
    }
  }, [isOpen, scheduleToEdit, newIconOptions]); // Dependencies: re-run if modal opens/closes or scheduleToEdit/options change

  // Effect to control body scroll when the modal is open/closed.
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'auto'; // Ensure scroll is re-enabled on unmount
    };
  }, [isOpen]);

  // Effect to handle clicks outside the icon dropdown to close it.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconDropdownRef.current && !iconDropdownRef.current.contains(event.target as Node)) {
        setIsIconDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handles changes to the duration input, ensuring it's a valid number or empty.
   * @param value The string value from the input.
   */
  const handleDurationChange = (value: string) => {
    // Only allow empty string or valid integers for duration
    setDuration(value === '' ? '' : parseInt(value, 10));
  };

  /**
   * Handles the form submission (saving or updating a schedule).
   */
  const handleSubmit = async () => {
    // Validate inputs
    const parsedDuration = Number(duration);
    if (!label.trim() || !time || isNaN(parsedDuration) || parsedDuration < 1) {
      showMessage('Please provide a valid label, time, and duration (min 1 min).', 'error');
      return;
    }

    setIsSubmitting(true);
    const now = Timestamp.now(); // Current timestamp for creation/update

    let newOrUpdatedSchedule: ScheduledRoutineBase;

    if (scheduleToEdit) {
      // If editing, update existing properties and `updatedAt`
      newOrUpdatedSchedule = {
        ...scheduleToEdit,
        label: label.trim(),
        time, // Use 'time'
        duration: parsedDuration, // Use 'duration'
        icon,
        updatedAt: now, // Update timestamp on modification
      };
    } else {
      // If creating a new schedule, set all required properties, including ID and timestamps
      newOrUpdatedSchedule = {
        id: generateUUID(), // Generate a unique ID for new items
        label: label.trim(),
        time, // Use 'time'
        duration: parsedDuration, // Use 'duration'
        icon,
        completed: false, // New routines start as not completed
        completedAt: null, // No completion time for new routines
        createdAt: now, // Set creation timestamp
        updatedAt: now, // Set update timestamp
      };
    }

    try {
      await onSave(newOrUpdatedSchedule, originalIndex); // Pass the routine and its original index
      onClose(); // Close the modal on successful save
    } catch (error) {
      console.error('Error saving schedule:', error);
      showMessage('Failed to save schedule. Please try again.', 'error');
    } finally {
      setIsSubmitting(false); // Reset submission state
    }
  };

  // Do not render the modal if it's not open.
  if (!isOpen) return null;

  // Dynamically get the React component for the currently selected icon.
  const CurrentFormIconComponent = iconComponentsMap[icon] || MdOutlineSettings;

  return (
    <>
      <div
        className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
        onClick={onClose} // Close modal when clicking outside content
        aria-modal="true" // Indicate to assistive technologies that this is a modal
        role="dialog" // Indicate this is a dialog window
      >
        <div
          className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl w-full max-w-md cursor-auto"
          onClick={e => e.stopPropagation()} // Prevent modal from closing when clicking inside
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">
              {scheduleToEdit ? 'Edit Schedule' : 'Add New Schedule'}
            </h2>
            <button
              className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10"
              onClick={onClose}
              aria-label="Close modal"
            >
              <FiX />
            </button>
          </div>

          {/* Modal Body: Form Fields */}
          <div className="p-6 space-y-6">
            {/* Label and Icon Input */}
            <div>
              <label htmlFor="schedule-label" className="block mb-2 text-sm text-white/70">
                Label
              </label>
              <div
                className="flex relative items-center rounded-lg border border-white/10 bg-black/20"
                ref={iconDropdownRef} // Ref for click outside logic
              >
                {/* Icon selection button */}
                <button
                  type="button"
                  onClick={() => setIsIconDropdownOpen(prev => !prev)}
                  className="flex items-center p-3 text-white rounded-l-lg cursor-pointer hover:bg-white/10"
                  aria-label="Select icon"
                  aria-expanded={isIconDropdownOpen}
                  aria-haspopup="true"
                >
                  <CurrentFormIconComponent size={20} />
                  {isIconDropdownOpen ? (
                    <MdOutlineKeyboardArrowUp size={20} className="ml-1" />
                  ) : (
                    <MdOutlineKeyboardArrowDown size={20} className="ml-1" />
                  )}
                </button>
                {/* Icon dropdown content */}
                {isIconDropdownOpen && (
                  <div className="overflow-y-auto absolute left-0 top-full z-50 p-2 mt-2 w-full max-h-48 rounded-lg border shadow-lg bg-neutral-900 border-white/10">
                    <div className="grid grid-cols-5 gap-1">
                      {newIconOptions.map(optionIconName => (
                        <button
                          key={optionIconName}
                          onClick={() => {
                            setIcon(optionIconName);
                            setIsIconDropdownOpen(false);
                          }}
                          className="flex justify-center items-center p-3 text-white rounded-md transition-colors hover:bg-white/10"
                          aria-label={`Select ${optionIconName} icon`}
                        >
                          {React.createElement(iconComponentsMap[optionIconName], { size: 24 })}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Label input field */}
                <input
                  id="schedule-label"
                  type="text"
                  placeholder={newInputLabelPlaceholder}
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  className="p-3 w-full text-white bg-transparent focus:outline-none"
                  aria-required="true"
                />
              </div>
            </div>

            {/* Time and Duration Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-time" className="block mb-2 text-sm text-white/70">
                  Start Time
                </label>
                <button
                  id="start-time"
                  onClick={() => setIsTimePickerOpen(true)}
                  className="p-3 w-full text-left text-white rounded-lg border cursor-pointer bg-black/20 border-white/10 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  aria-haspopup="true"
                  aria-expanded={isTimePickerOpen}
                >
                  {/* Format the time for display */}
                  {format(parse(time, 'HH:mm', new Date()), 'h:mm a')}
                </button>
              </div>
              <div>
                <label htmlFor="duration-minutes" className="block mb-2 text-sm text-white/70">
                  Duration (min)
                </label>
                <input
                  id="duration-minutes"
                  type="number"
                  min={1} // Changed min from 10 to 1 for more flexibility
                  placeholder="e.g., 30"
                  value={duration}
                  onChange={e => handleDurationChange(e.target.value)}
                  className="p-3 w-full text-white rounded-lg border bg-black/20 border-white/10 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  aria-required="true"
                  aria-label="Duration in minutes"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer: Save Button */}
          <div className="p-6 border-t border-white/10">
            <button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !label.trim() ||
                !time ||
                Number(duration) < 1 ||
                isNaN(Number(duration))
              }
              className="inline-flex gap-2 justify-center items-center py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 hover:bg-white/90 disabled:opacity-60"
              aria-label={buttonLabel}
            >
              {isSubmitting ? (
                <FiLoader className="w-5 h-5 animate-spin" />
              ) : (
                <FiCheck className="w-5 h-5" />
              )}
              <span>{buttonLabel}</span>
            </button>
          </div>
        </div>
      </div>
      {/* DateTimePicker component for time selection */}
      <DateTimePicker
        isOpen={isTimePickerOpen}
        // Parse the 'time' string into a Date object for the picker
        value={parse(time, 'HH:mm', new Date())}
        onChange={date => {
          // If a date is selected, format it back to 'HH:mm' string
          if (date) setTime(format(date, 'HH:mm'));
        }}
        onClose={() => setIsTimePickerOpen(false)}
        mode="time" // Set picker to time mode
      />
    </>
  );
};

export default ScheduleEditModal;
