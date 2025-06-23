// app/components/routine/ScheduleEditModal.tsx
'use client';

import { DateTimePicker } from '@/components/common/DateTimePicker';
import { ScheduledRoutineBase } from '@/types';
import { format, parse } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FiCheck, FiLoader, FiX } from 'react-icons/fi';
import { MdOutlineSettings } from 'react-icons/md';
// NEW: Import useNotificationStore to use showToast
import { useNotificationStore } from '@/store/useNotificationStore';

// React Hook Form imports
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
// Import the new schema for the form
import { scheduleEditFormSchema } from '@/utils/schemas';
import z from 'zod';

// Define the type for the form data based on the Zod schema
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

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ScheduleEditFormData>({
    resolver: zodResolver(scheduleEditFormSchema),
    defaultValues: {
      label: '',
      time: new Date(), // Default to current time for time picker
      duration: 30,
      icon: newIconOptions[0], // Default to the first icon option
    },
  });

  // Watch the time field for DateTimePicker
  const scheduleTime = watch('time');
  const selectedIcon = watch('icon'); // Watch the selected icon

  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (scheduleToEdit) {
        // Set form values when modal opens and scheduleToEdit is provided
        reset({
          label: scheduleToEdit.label,
          time: parse(scheduleToEdit.time, 'HH:mm', new Date()), // Parse string time to Date
          duration: scheduleToEdit.duration,
          icon: scheduleToEdit.icon,
        });
      } else {
        // Reset form to default values if adding a new schedule
        reset({
          label: '',
          time: new Date(),
          duration: 30,
          icon: newIconOptions[0],
        });
      }
      // Ensure submitting state is reset on open
      // This is handled by isSubmitting from formState, but also to be safe.
      // setIsSubmitting(false); // No longer needed as formState.isSubmitting covers this.
      setIsTimePickerOpen(false); // Close time picker when modal opens
    }
  }, [isOpen, scheduleToEdit, newIconOptions, reset]);

  // Effect to display validation errors as toasts
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      // Only run if there are actual errors
      for (const key in errors) {
        const error = errors[key as keyof ScheduleEditFormData];
        if (error?.message) {
          showToast(error.message, 'error');
        }
      }
    }
  }, [errors, showToast]);

  // Handle modal body overflow when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle form submission
  const onSubmit: SubmitHandler<ScheduleEditFormData> = async data => {
    // isSubmitting from formState covers button disabled state
    // Manual validation check for empty label, time, duration no longer needed due to Zod schema

    const now = Timestamp.now();
    const finalTime = format(data.time, 'HH:mm'); // Format Date object back to HH:mm string

    let newOrUpdatedSchedule: ScheduledRoutineBase;

    if (scheduleToEdit) {
      // If editing existing
      newOrUpdatedSchedule = {
        ...scheduleToEdit, // Keep original ID, createdAt etc.
        label: data.label.trim(),
        time: finalTime,
        duration: data.duration,
        icon: data.icon,
        updatedAt: now,
      };
    } else {
      // If adding new
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
        className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm cursor-pointer bg-black/60"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
      >
        <div
          className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl w-full max-w-md cursor-auto"
          onClick={e => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">
                {scheduleToEdit ? 'Edit Schedule' : 'Add New Schedule'}
              </h2>
              <button
                type="button"
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
                    const isSelected = selectedIcon === optionIconName;
                    return (
                      <button
                        key={optionIconName}
                        type="button" // Prevent form submission
                        onClick={() =>
                          setValue('icon', optionIconName, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
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
                  {...register('label')} // Register the input
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
                    type="button" // Prevent form submission
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
                    {...register('duration', { valueAsNumber: true })} // Register as number
                    className="p-3 w-full text-white rounded-lg border bg-black/20 border-white/10 focus:ring-2 focus:ring-white focus:outline-none"
                    aria-required="true"
                    aria-label="Duration in minutes"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/10">
              <button
                type="submit"
                disabled={isSubmitting || !isDirty} // Disable if submitting or no changes
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
          </form>
        </div>
      </div>
      <DateTimePicker
        isOpen={isTimePickerOpen}
        value={scheduleTime} // Pass the Date object directly
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
