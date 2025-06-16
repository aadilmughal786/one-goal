// app/components/routine/ScheduleEditModal.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiX, FiLoader } from 'react-icons/fi'; // From Feather Icons
import {
  MdOutlineSettings,
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowUp,
} from 'react-icons/md'; // Corrected import for MdOutlineKeyboardArrow*
import { ScheduledRoutineBase } from '@/types';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp

interface ScheduleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleToEdit: ScheduledRoutineBase | null; // Null for add mode, object for edit mode
  originalIndex: number | null; // Pass original index separately for editing
  // Callback when saving a new schedule or updating an existing one
  onSave: (schedule: ScheduledRoutineBase, originalIndex: number | null) => Promise<void>;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;

  // Props from RoutineSectionCard for the form and icons
  newInputLabelPlaceholder: string;
  newIconOptions: string[];
  iconComponentsMap: { [key: string]: React.ElementType };
  buttonLabel: string; // e.g., "Add & Save Schedule" or "Save Changes"
}

const ScheduleEditModal: React.FC<ScheduleEditModalProps> = ({
  isOpen,
  onClose,
  scheduleToEdit,
  originalIndex, // Destructure originalIndex
  onSave,
  showMessage,
  newInputLabelPlaceholder,
  newIconOptions,
  iconComponentsMap,
  buttonLabel,
}) => {
  const [label, setLabel] = useState('');
  const [scheduledTime, setScheduledTime] = useState(format(new Date(), 'HH:mm'));
  const [durationMinutes, setDurationMinutes] = useState<number | string>('');
  const [icon, setIcon] = useState(newIconOptions[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);

  const iconDropdownRef = useRef<HTMLDivElement>(null);

  // Populate form fields when modal opens or scheduleToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (scheduleToEdit) {
        setLabel(scheduleToEdit.label);
        setScheduledTime(scheduleToEdit.scheduledTime);
        setDurationMinutes(scheduleToEdit.durationMinutes);
        setIcon(scheduleToEdit.icon);
      } else {
        // Reset for add mode
        setLabel('');
        setScheduledTime(format(new Date(), 'HH:mm'));
        setDurationMinutes('');
        setIcon(newIconOptions[0]);
      }
      setIsSubmitting(false); // Reset submitting state
    }
  }, [isOpen, scheduleToEdit, newIconOptions]);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconDropdownRef.current && !iconDropdownRef.current.contains(event.target as Node)) {
        setIsIconDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDurationChange = useCallback((value: string) => {
    const val = parseInt(value);
    setDurationMinutes(isNaN(val) ? '' : val);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLInputElement>) => {
    if (e.currentTarget instanceof HTMLInputElement) {
      e.currentTarget.blur();
    }
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleSubmit = async () => {
    const parsedDuration = parseInt(String(durationMinutes));
    if (!label.trim() || !scheduledTime || isNaN(parsedDuration) || parsedDuration < 1) {
      showMessage('Please provide a valid label, time, and duration (min 1 min).', 'error');
      return;
    }

    setIsSubmitting(true);
    const newOrUpdatedSchedule: ScheduledRoutineBase = {
      label: label.trim(),
      scheduledTime: scheduledTime,
      durationMinutes: parsedDuration,
      icon: icon,
      // For new schedules, completed is null. For edited, preserve original completed status.
      completed: scheduleToEdit ? scheduleToEdit.completed : null,
      // updatedAt is ALWAYS set to Timestamp.now() by the service, so we don't pass an old one.
      // This property is required in ScheduledRoutineBase, so initialize it here.
      updatedAt: Timestamp.now(),
    };

    try {
      // Pass originalIndex to onSave, which RoutineSectionCard will use for update logic
      await onSave(newOrUpdatedSchedule, originalIndex);
      onClose(); // Close modal on success
    } catch (error) {
      console.error('Failed to save schedule:', error);
      showMessage('Failed to save schedule. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const CurrentFormIconComponent =
    iconComponentsMap[icon] || iconComponentsMap[newIconOptions[0]] || MdOutlineSettings;

  return (
    <>
      {/* Inline style to make time picker icon white (for webkit browsers) */}
      <style>{`
        input[type="time"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
            cursor: pointer;
        }
      `}</style>
      <div
        className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm cursor-pointer bg-black/60"
        onClick={onClose}
      >
        <div
          className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl w-full max-w-md cursor-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">
              {scheduleToEdit ? 'Edit Schedule' : 'Add New Schedule'}
            </h2>
            <button
              className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
              onClick={onClose}
              aria-label="Close modal"
            >
              <FiX />
            </button>
          </div>
          <div className="p-6 space-y-6">
            {/* Label & Icon Select */}
            <div
              className="flex relative justify-between items-center rounded-lg border border-white/10 bg-black/20"
              ref={iconDropdownRef}
            >
              <input
                type="text"
                placeholder={newInputLabelPlaceholder}
                value={label}
                onChange={e => setLabel(e.target.value)}
                className="p-3 pr-16 w-full text-white bg-transparent border-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsIconDropdownOpen(prev => !prev)}
                className="flex absolute right-1 justify-center items-center text-white rounded-md cursor-pointer focus:outline-none"
              >
                {React.createElement(CurrentFormIconComponent, { size: 24 })}
                {isIconDropdownOpen ? (
                  <MdOutlineKeyboardArrowUp size={20} />
                ) : (
                  <MdOutlineKeyboardArrowDown size={20} />
                )}
              </button>
              {isIconDropdownOpen && (
                <div className="overflow-y-auto absolute left-0 top-full z-50 p-2 mt-2 w-full max-h-60 rounded-lg border shadow-lg bg-neutral-900 border-white/10">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {newIconOptions.map(optionIconName => (
                      <button
                        key={optionIconName}
                        onClick={() => {
                          setIcon(optionIconName);
                          setIsIconDropdownOpen(false);
                        }}
                        className="flex flex-shrink-0 justify-center items-center p-3 text-white rounded-md transition-colors cursor-pointer hover:bg-white/10"
                      >
                        {React.createElement(iconComponentsMap[optionIconName], { size: 24 })}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Time and Duration Inputs */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                type="time"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                className="p-3 w-full text-white rounded-lg border cursor-pointer focus:ring-2 focus:ring-purple-500 bg-black/20 border-white/10"
              />
              <input
                type="text" // Use text to allow empty string, parse to number on save
                placeholder="Duration (min)"
                value={durationMinutes}
                onChange={e => handleDurationChange(e.target.value)}
                onWheel={handleWheel}
                className="p-3 w-full text-white rounded-lg border focus:ring-2 focus:ring-purple-500 bg-black/20 border-white/10"
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
                  <MdOutlineSettings size={20} /> {buttonLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScheduleEditModal;
