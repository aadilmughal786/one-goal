// app/components/routine/ScheduleEditModal.tsx
'use client';

import { DateTimePicker } from '@/components/common/DateTimePicker';
import { useNotificationStore } from '@/store/useNotificationStore';
import { ScheduledRoutineBase } from '@/types';
import { format, parse } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FiCheck, FiLoader, FiX } from 'react-icons/fi';
import { MdOutlineSettings } from 'react-icons/md';

import { scheduleEditFormSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

type ScheduleEditFormData = z.infer<typeof scheduleEditFormSchema>;

interface ScheduleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleToEdit: ScheduledRoutineBase | null;
  originalIndex: number | null;
  onSave: (schedule: ScheduledRoutineBase, originalIndex: number | null) => Promise<void>;
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
  newInputLabelPlaceholder,
  newIconOptions,
  iconComponentsMap,
  buttonLabel,
}) => {
  const showToast = useNotificationStore(state => state.showToast);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<ScheduleEditFormData>({
    resolver: zodResolver(scheduleEditFormSchema),
    defaultValues: {
      label: '',
      time: new Date(),
      duration: 30,
      icon: newIconOptions[0],
    },
    mode: 'onTouched',
  });

  const scheduleTime = watch('time');
  const selectedIcon = watch('icon');

  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (scheduleToEdit) {
        reset(
          {
            label: scheduleToEdit.label,
            time: parse(scheduleToEdit.time, 'HH:mm', new Date()),
            duration: scheduleToEdit.duration,
            icon: scheduleToEdit.icon,
          },
          { keepDirty: false }
        );
      } else {
        reset(
          {
            label: '',
            time: new Date(),
            duration: 30,
            icon: newIconOptions[0],
          },
          { keepDirty: false }
        );
      }
      setIsTimePickerOpen(false);
    }
  }, [isOpen, scheduleToEdit, newIconOptions, reset]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      for (const key in errors) {
        const error = errors[key as keyof ScheduleEditFormData];
        if (error?.message) {
          showToast(error.message, 'error');
        }
      }
    }
  }, [errors, showToast]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const onSubmit: SubmitHandler<ScheduleEditFormData> = async data => {
    const now = Timestamp.now();
    const finalTime = format(data.time, 'HH:mm');

    let newOrUpdatedSchedule: ScheduledRoutineBase;

    if (scheduleToEdit) {
      newOrUpdatedSchedule = {
        ...scheduleToEdit,
        label: data.label.trim(),
        time: finalTime,
        duration: data.duration,
        icon: data.icon,
        updatedAt: now,
      };
    } else {
      newOrUpdatedSchedule = {
        id: generateUUID(),
        label: data.label.trim(),
        time: finalTime,
        duration: data.duration,
        icon: data.icon,
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
      showToast('Failed to save schedule. Please try again.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="flex fixed inset-0 z-40 justify-center items-center p-4 h-full backdrop-blur-sm cursor-pointer bg-black/60"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
      >
        <div
          className="w-full max-w-xl rounded-3xl border shadow-2xl backdrop-blur-md cursor-auto bg-bg-secondary border-border-primary"
          onClick={e => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex justify-between items-center p-6 border-b border-border-primary">
              <h2 className="text-xl font-semibold text-text-primary">
                {scheduleToEdit ? 'Edit Schedule' : 'Add New Schedule'}
              </h2>
              <button
                type="button"
                className="p-1.5 cursor-pointer rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary"
                onClick={onClose}
                aria-label="Close modal"
              >
                <FiX />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block mb-2 text-sm text-text-secondary">Icon</label>
                <div className="flex flex-wrap gap-2 p-2 rounded-lg border bg-bg-primary border-border-primary">
                  {newIconOptions.map(optionIconName => {
                    const IconComponent = iconComponentsMap[optionIconName] || MdOutlineSettings;
                    const isSelected = selectedIcon === optionIconName;
                    return (
                      <button
                        key={optionIconName}
                        type="button"
                        onClick={() =>
                          setValue('icon', optionIconName, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                        className={`flex justify-center items-center p-3 rounded-md transition-all duration-200
                          ${isSelected ? 'text-white bg-blue-500' : 'text-text-secondary bg-bg-tertiary hover:bg-border-primary hover:text-text-primary'} cursor-pointer`}
                        aria-label={`Select ${optionIconName} icon`}
                        title={optionIconName
                          .replace('MdOutline', '')
                          .replace('Fa', '')
                          .replace('MdSports', '')}
                      >
                        <IconComponent size={24} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label htmlFor="schedule-label" className="block mb-2 text-sm text-text-secondary">
                  Label
                </label>
                <input
                  id="schedule-label"
                  type="text"
                  placeholder={newInputLabelPlaceholder}
                  {...register('label')}
                  className="p-3 w-full rounded-lg border text-text-primary bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
                  aria-required="true"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start-time" className="block mb-2 text-sm text-text-secondary">
                    Start Time
                  </label>
                  <button
                    id="start-time"
                    type="button"
                    onClick={() => setIsTimePickerOpen(true)}
                    className="p-3 w-full text-left rounded-lg border cursor-pointer text-text-primary bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
                    aria-haspopup="true"
                    aria-expanded={isTimePickerOpen}
                  >
                    {format(scheduleTime, 'HH:mm')}
                  </button>
                </div>
                <div>
                  <label
                    htmlFor="duration-minutes"
                    className="block mb-2 text-sm text-text-secondary"
                  >
                    Duration (min)
                  </label>
                  <input
                    id="duration-minutes"
                    type="number"
                    min={1}
                    placeholder="e.g., 30"
                    {...register('duration', { valueAsNumber: true })}
                    className="p-3 w-full rounded-lg border text-text-primary bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
                    aria-required="true"
                    aria-label="Duration in minutes"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border-primary">
              <button
                type="submit"
                disabled={isSubmitting || !isDirty || !isValid}
                className="inline-flex gap-2 justify-center items-center py-3 w-full text-lg font-semibold rounded-full transition-all duration-200 cursor-pointer text-bg-primary bg-text-primary hover:opacity-90 disabled:opacity-60"
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
          </form>
        </div>
      </div>
      <DateTimePicker
        isOpen={isTimePickerOpen}
        value={scheduleTime}
        onChange={date => {
          if (date) {
            setValue('time', date, { shouldValidate: true, shouldDirty: true });
          }
        }}
        onClose={() => setIsTimePickerOpen(false)}
        mode="time"
      />
    </>
  );
};

export default ScheduleEditModal;
