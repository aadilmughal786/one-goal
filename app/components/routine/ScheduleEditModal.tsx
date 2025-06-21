// app/components/routine/ScheduleEditModal.tsx
'use client';

import { DateTimePicker } from '@/components/common/DateTimePicker';
import { ScheduledRoutineBase } from '@/types';
import { format, parse } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FiCheck, FiLoader, FiX } from 'react-icons/fi';
import { MdOutlineSettings } from 'react-icons/md';

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
  const [duration, setDuration] = useState<number | ''>(30);
  const [icon, setIcon] = useState(newIconOptions[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [scheduleTime, setScheduleTime] = useState<Date>(new Date());

  useEffect(() => {
    if (isOpen) {
      if (scheduleToEdit) {
        setLabel(scheduleToEdit.label);
        setScheduleTime(parse(scheduleToEdit.time, 'HH:mm', new Date()));
        setDuration(scheduleToEdit.duration);
        setIcon(scheduleToEdit.icon);
      } else {
        setLabel('');
        setScheduleTime(new Date());
        setDuration(30);
        setIcon(newIconOptions[0]);
      }
      setIsSubmitting(false);
      setIsTimePickerOpen(false);
    }
  }, [isOpen, scheduleToEdit, newIconOptions]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleDurationChange = (value: string) => {
    setDuration(value === '' ? '' : parseInt(value, 10));
  };

  const handleSubmit = async () => {
    const parsedDuration = Number(duration);
    if (!label.trim() || !scheduleTime || isNaN(parsedDuration) || parsedDuration < 1) {
      showMessage('Please provide a valid label, time, and duration (min 1 min).', 'error');
      return;
    }

    setIsSubmitting(true);
    const now = Timestamp.now();
    const finalTime = format(scheduleTime, 'HH:mm');

    let newOrUpdatedSchedule: ScheduledRoutineBase;

    if (scheduleToEdit) {
      newOrUpdatedSchedule = {
        ...scheduleToEdit,
        label: label.trim(),
        time: finalTime,
        duration: parsedDuration,
        icon,
        updatedAt: now,
      };
    } else {
      newOrUpdatedSchedule = {
        id: generateUUID(),
        label: label.trim(),
        time: finalTime,
        duration: parsedDuration,
        icon,
        completed: false,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      };
    }

    try {
      await onSave(newOrUpdatedSchedule, originalIndex);
      onClose();
    } catch (error) {
      console.error('Error saving schedule:', error);
      showMessage('Failed to save schedule. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm cursor-pointer bg-black/60"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
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
            <div>
              <label className="block mb-2 text-sm text-white/70">Icon</label>
              <div className="flex flex-wrap gap-2 p-2 rounded-lg border bg-black/20 border-white/10">
                {newIconOptions.map(optionIconName => {
                  const IconComponent = iconComponentsMap[optionIconName] || MdOutlineSettings;
                  const isSelected = icon === optionIconName;
                  return (
                    <button
                      key={optionIconName}
                      onClick={() => setIcon(optionIconName)}
                      className={`flex justify-center items-center p-3 rounded-md transition-all duration-200 cursor-pointer
                        ${isSelected ? 'text-black bg-white' : 'text-white/70 bg-white/5 hover:bg-white/10 hover:text-white'}`}
                      aria-label={`Select ${optionIconName} icon`}
                      title={optionIconName.replace('MdOutline', '').replace('Fa', '')}
                    >
                      <IconComponent size={24} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label htmlFor="schedule-label" className="block mb-2 text-sm text-white/70">
                Label
              </label>
              <input
                id="schedule-label"
                type="text"
                placeholder={newInputLabelPlaceholder}
                value={label}
                onChange={e => setLabel(e.target.value)}
                className="p-3 w-full text-white rounded-lg border bg-black/20 border-white/10 focus:ring-2 focus:ring-white focus:outline-none"
                aria-required="true"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-time" className="block mb-2 text-sm text-white/70">
                  Start Time
                </label>
                <button
                  id="start-time"
                  onClick={() => setIsTimePickerOpen(true)}
                  className="p-3 w-full text-left text-white rounded-lg border cursor-pointer bg-black/20 border-white/10 focus:ring-2 focus:ring-white focus:outline-none"
                  aria-haspopup="true"
                  aria-expanded={isTimePickerOpen}
                >
                  {format(scheduleTime, 'HH:mm')}
                </button>
              </div>
              <div>
                <label htmlFor="duration-minutes" className="block mb-2 text-sm text-white/70">
                  Duration (min)
                </label>
                <input
                  id="duration-minutes"
                  type="number"
                  min={1}
                  placeholder="e.g., 30"
                  value={duration}
                  onChange={e => handleDurationChange(e.target.value)}
                  className="p-3 w-full text-white rounded-lg border bg-black/20 border-white/10 focus:ring-2 focus:ring-white focus:outline-none"
                  aria-required="true"
                  aria-label="Duration in minutes"
                />
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-white/10">
            <button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !label.trim() ||
                !scheduleTime ||
                Number(duration) < 1 ||
                isNaN(Number(duration))
              }
              className="inline-flex gap-2 justify-center items-center py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer hover:bg-white/90 disabled:opacity-60"
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
      <DateTimePicker
        isOpen={isTimePickerOpen}
        value={scheduleTime}
        onChange={date => {
          if (date) {
            setScheduleTime(date);
          }
        }}
        onClose={() => setIsTimePickerOpen(false)}
        mode="time"
      />
    </>
  );
};

export default ScheduleEditModal;
