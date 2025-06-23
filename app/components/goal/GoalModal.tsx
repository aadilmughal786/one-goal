// app/components/goal/GoalModal.tsx
'use client';

import { DateTimePicker } from '@/components/common/DateTimePicker';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { FiCalendar, FiLoader, FiTarget, FiX } from 'react-icons/fi';
import { MdRocketLaunch } from 'react-icons/md';
// NEW: Import useNotificationStore to use showToast
import { useNotificationStore } from '@/store/useNotificationStore';

// React Hook Form imports
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
// Import the new schema for the form
import { goalFormSchema } from '@/utils/schemas';
import z from 'zod';

// Define the type for the form data based on the Zod schema
type GoalFormData = z.infer<typeof goalFormSchema>;

interface ModalGoalData {
  name: string;
  description: string | null;
  startDate: string; // Keeping as string for initialGoalData compatibility
  endDate: string; // Keeping as string for initialGoalData compatibility
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

  // Define the maximum length for the description based on the Zod schema
  const MAX_DESCRIPTION_LENGTH = 500;

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: '',
      description: '',
      endDate: null,
    },
    mode: 'onTouched',
  });

  // Watch the description field to track its length for the counter
  const descriptionValue = watch('description');
  const currentDescriptionLength = descriptionValue ? descriptionValue.length : 0;

  // Watch the endDate field to pass it to DateTimePicker
  const currentEndDate = watch('endDate');

  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialGoalData) {
        // Set form values when modal opens in edit mode
        reset(
          {
            name: initialGoalData.name,
            description: initialGoalData.description || '', // Ensure empty string for null
            endDate: new Date(initialGoalData.endDate), // Convert string to Date
          },
          { keepDirty: false }
        ); // Reset dirty state on modal open
      } else {
        // Reset form to default values for new goal creation
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        reset(
          {
            name: '',
            description: '',
            endDate: tomorrow, // Default to tomorrow
          },
          { keepDirty: false }
        ); // Reset dirty state on modal open
      }
    }
  }, [isOpen, isEditMode, initialGoalData, reset]);

  // Effect to display validation errors as toasts
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      // Only run if there are actual errors
      for (const key in errors) {
        const error = errors[key as keyof GoalFormData];
        if (error?.message) {
          showToast(error.message, 'error');
        }
      }
    }
  }, [errors, showToast]);

  // Handle form submission
  const onSubmit: SubmitHandler<GoalFormData> = async data => {
    try {
      // Ensure endDate is not null before passing to onSetGoal
      if (!data.endDate) {
        showToast('Target date and time are required.', 'error');
        return;
      }
      // Pass data.description directly, as Zod now ensures it's a string
      await onSetGoal(data.name, data.endDate, data.description);
      onClose(); // Close the modal on successful submission
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
                    {...register('name')} // Register the input
                    className="p-3 w-full text-base text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="goalDescription" className="text-sm font-medium text-white/70">
                      Description <span className="text-red-400">*</span>
                    </label>
                    {/* Character counter for description */}
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
                    maxLength={MAX_DESCRIPTION_LENGTH} // Enforce max length in UI
                    {...register('description')} // Register the textarea
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
                    className="p-3 w-full text-base text-left text-white rounded-md border bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
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
        value={currentEndDate ?? null} // Ensure value is Date | null
        onChange={date => {
          setValue('endDate', date, { shouldValidate: true, shouldDirty: true });
        }}
        onClose={() => setIsPickerOpen(false)}
        mode="datetime"
      />
    </>
  );
};

export default GoalModal;
