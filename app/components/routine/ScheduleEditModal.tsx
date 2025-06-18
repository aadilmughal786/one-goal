// app/components/routine/ScheduleEditModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiLoader, FiCheck } from 'react-icons/fi';
import {
  MdOutlineSettings,
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowUp,
} from 'react-icons/md';
import { ScheduledRoutineBase } from '@/types';
import { format, parse } from 'date-fns';
import { DateTimePicker } from '@/components/common/DateTimePicker'; // Import the new component

interface ScheduleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleToEdit: ScheduledRoutineBase | null;
  originalIndex: number | null;
  onSave: (schedule: ScheduledRoutineBase, originalIndex: number | null) => Promise<void>;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  newInputLabelPlaceholder: string;
  newIconOptions: string[];
  iconComponentsMap: { [key: string]: React.ElementType };
  buttonLabel: string;
}

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
  const [scheduledTime, setScheduledTime] = useState(format(new Date(), 'HH:mm'));
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(30);
  const [icon, setIcon] = useState(newIconOptions[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false); // State for the time picker
  const iconDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (scheduleToEdit) {
        setLabel(scheduleToEdit.label);
        setScheduledTime(scheduleToEdit.scheduledTime);
        setDurationMinutes(scheduleToEdit.durationMinutes);
        setIcon(scheduleToEdit.icon);
      } else {
        setLabel('');
        setScheduledTime(format(new Date(), 'HH:mm'));
        setDurationMinutes(30);
        setIcon(newIconOptions[0]);
      }
      setIsSubmitting(false);
    }
  }, [isOpen, scheduleToEdit, newIconOptions]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconDropdownRef.current && !iconDropdownRef.current.contains(event.target as Node)) {
        setIsIconDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDurationChange = (value: string) => {
    setDurationMinutes(value === '' ? '' : parseInt(value, 10));
  };

  const handleSubmit = async () => {
    const parsedDuration = Number(durationMinutes);
    if (!label.trim() || !scheduledTime || isNaN(parsedDuration) || parsedDuration < 1) {
      showMessage('Please provide a valid label, time, and duration (min 1 min).', 'error');
      return;
    }

    setIsSubmitting(true);
    const newOrUpdatedSchedule: ScheduledRoutineBase = {
      ...(scheduleToEdit || {}),
      label: label.trim(),
      scheduledTime,
      durationMinutes: parsedDuration,
      icon,
      completed: scheduleToEdit ? scheduleToEdit.completed : null,
    };

    try {
      await onSave(newOrUpdatedSchedule, originalIndex);
      onClose();
    } catch {
      showMessage('Failed to save schedule. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const CurrentFormIconComponent = iconComponentsMap[icon] || MdOutlineSettings;

  return (
    <>
      <div
        className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
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
              className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10"
              onClick={onClose}
              aria-label="Close modal"
            >
              <FiX />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block mb-2 text-sm text-white/70">Label</label>
              <div
                className="flex relative items-center rounded-lg border border-white/10 bg-black/20"
                ref={iconDropdownRef}
              >
                <button
                  type="button"
                  onClick={() => setIsIconDropdownOpen(prev => !prev)}
                  className="flex items-center p-3 text-white rounded-l-lg cursor-pointer hover:bg-white/10"
                >
                  <CurrentFormIconComponent size={20} />
                  {isIconDropdownOpen ? (
                    <MdOutlineKeyboardArrowUp size={20} className="ml-1" />
                  ) : (
                    <MdOutlineKeyboardArrowDown size={20} className="ml-1" />
                  )}
                </button>
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
                        >
                          {React.createElement(iconComponentsMap[optionIconName], { size: 24 })}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <input
                  type="text"
                  placeholder={newInputLabelPlaceholder}
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  className="p-3 w-full text-white bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm text-white/70">Start Time</label>
                <button
                  onClick={() => setIsTimePickerOpen(true)}
                  className="p-3 w-full text-left text-white rounded-lg border cursor-pointer bg-black/20 border-white/10 focus:ring-2 focus:ring-purple-500"
                >
                  {format(parse(scheduledTime, 'HH:mm', new Date()), 'h:mm a')}
                </button>
              </div>
              <div>
                <label className="block mb-2 text-sm text-white/70">Duration (min)</label>
                <input
                  type="number"
                  min={10}
                  max={150}
                  placeholder="e.g., 30"
                  value={durationMinutes}
                  onChange={e => handleDurationChange(e.target.value)}
                  className="p-3 w-full text-white rounded-lg border bg-black/20 border-white/10 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/10">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex gap-2 justify-center items-center py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 hover:bg-white/90 disabled:opacity-60"
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
      <DateTimePicker
        isOpen={isTimePickerOpen}
        value={parse(scheduledTime, 'HH:mm', new Date())}
        onChange={date => {
          if (date) setScheduledTime(format(date, 'HH:mm'));
        }}
        onClose={() => setIsTimePickerOpen(false)}
        mode="time"
      />
    </>
  );
};

export default ScheduleEditModal;
