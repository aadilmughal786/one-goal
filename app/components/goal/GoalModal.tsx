// app/components/goal/GoalModal.tsx
'use client';

import { DateTimePicker } from '@/components/common/DateTimePicker';
import { useNotificationStore } from '@/store/useNotificationStore';
import { goalFormSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FiCalendar, FiLoader, FiTarget, FiX } from 'react-icons/fi';
import { MdRocketLaunch } from 'react-icons/md';
import { z } from 'zod';

type GoalFormData = z.infer<typeof goalFormSchema>;

interface ModalGoalData {
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetGoal: (goalName: string, endDate: Date, description: string) => Promise<void>;
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
  const showToast = useNotificationStore(state => state.showToast);
  const MAX_DESCRIPTION_LENGTH = 500;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    // FIX: Provide a valid default Date that meets the schema's requirements.
    defaultValues: {
      name: '',
      description: '',
      endDate: new Date(new Date().setDate(new Date().getDate() + 1)), // Default to tomorrow
    },
    mode: 'onTouched',
  });

  const descriptionValue = watch('description');
  const currentDescriptionLength = descriptionValue ? descriptionValue.length : 0;
  const currentEndDate = watch('endDate');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialGoalData) {
        reset({
          name: initialGoalData.name,
          description: initialGoalData.description || '',
          endDate: new Date(initialGoalData.endDate),
        });
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        reset({
          name: '',
          description: '',
          endDate: tomorrow,
        });
      }
    }
  }, [isOpen, isEditMode, initialGoalData, reset]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      for (const key in errors) {
        const error = errors[key as keyof GoalFormData];
        if (error?.message) {
          showToast(error.message, 'error');
        }
      }
    }
  }, [errors, showToast]);

  const onSubmit: SubmitHandler<GoalFormData> = async data => {
    try {
      await onSetGoal(data.name, data.endDate, data.description);
      onClose();
    } catch (error) {
      showToast((error as Error).message || 'An unknown error occurred.', 'error');
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
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <div className="flex gap-3 items-center">
                <FiTarget className="w-5 h-5 text-white" />
                <h2 className="text-xl font-semibold text-white">
                  {isEditMode ? 'Update Your Goal' : 'Set a New Goal'}
                </h2>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 focus:outline-none cursor-pointer"
                onClick={onClose}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="goalName"
                    className="block mb-2 text-sm font-medium text-white/70"
                  >
                    Goal Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="goalName"
                    type="text"
                    placeholder="e.g., Complete Project Phoenix"
                    {...register('name')}
                    className="p-3 w-full text-base text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="goalDescription" className="text-sm font-medium text-white/70">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <span
                      className={`text-xs ${
                        currentDescriptionLength > MAX_DESCRIPTION_LENGTH
                          ? 'text-red-400'
                          : 'text-white/50'
                      }`}
                    >
                      {currentDescriptionLength}/{MAX_DESCRIPTION_LENGTH}
                    </span>
                  </div>
                  <textarea
                    id="goalDescription"
                    placeholder="Describe what success looks like..."
                    rows={3}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    {...register('description')}
                    className="p-3 w-full text-base text-white rounded-md border resize-none border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block mb-2 text-sm font-medium text-white/70">
                    <FiCalendar className="inline -mt-1 mr-1" /> Target Date & Time{' '}
                    <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(true)}
                    className="p-3 w-full text-base text-left text-white rounded-md border cursor-pointer bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    {currentEndDate ? (
                      format(currentEndDate, "MMMM d,yyyy 'at' h:mm a")
                    ) : (
                      <span className="text-white/50">Set a deadline</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10">
              <button
                type="submit"
                disabled={isSubmitting || !isDirty || !isValid}
                className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60"
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
          </form>
        </div>
      </div>
      <DateTimePicker
        isOpen={isPickerOpen}
        value={currentEndDate}
        onChange={date => {
          // FIX: Ensure the date from the picker is not null before setting it.
          if (date) {
            setValue('endDate', date, { shouldValidate: true, shouldDirty: true });
          }
        }}
        onClose={() => setIsPickerOpen(false)}
        mode="datetime"
      />
    </>
  );
};

export default GoalModal;
