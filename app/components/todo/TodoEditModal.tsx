// app/components/todo/TodoEditModal.tsx
'use client';

import { DateTimePicker } from '@/components/common/DateTimePicker';
import { useNotificationStore } from '@/store/useNotificationStore';
import { TodoItem } from '@/types';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { FiCalendar, FiEdit, FiLoader, FiSave, FiTrash2, FiX } from 'react-icons/fi';

// React Hook Form imports
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
// Import the schema from the consolidated schemas file
import { todoEditFormSchema } from '@/utils/schemas'; // <--- CORRECTED IMPORT PATH
import z from 'zod';

// Define the type for the form data based on the Zod schema
type TodoEditFormData = z.infer<typeof todoEditFormSchema>;

interface TodoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  todoItem: TodoItem | null;
  onSave: (id: string, updates: Partial<TodoItem>) => Promise<void>;
}

const TodoEditModal: React.FC<TodoEditModalProps> = ({ isOpen, onClose, todoItem, onSave }) => {
  const showToast = useNotificationStore(state => state.showToast);

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid }, // FIX: Added isValid to formState destructuring
  } = useForm<TodoEditFormData>({
    resolver: zodResolver(todoEditFormSchema),
    defaultValues: {
      text: '',
      description: '',
      deadline: null,
    },
    mode: 'onTouched', // FIX: Set validation mode to 'onTouched'
  });

  // Watch the deadline field to pass it to DateTimePicker
  const currentDeadline = watch('deadline');

  const [isPickerOpen, setIsPickerOpen] = useState(false); // State for picker visibility

  useEffect(() => {
    if (isOpen) {
      if (todoItem) {
        // Set form values when modal opens and todoItem is provided
        reset(
          {
            text: todoItem.text,
            description: todoItem.description || '',
            deadline: todoItem.deadline ? todoItem.deadline.toDate() : null,
          },
          { keepDirty: false }
        ); // Reset dirty state on modal open
      } else {
        // Reset form to default values if no todoItem (e.g., if used for new todo in future)
        reset(
          {
            text: '',
            description: '',
            deadline: null,
          },
          { keepDirty: false }
        ); // Reset dirty state on modal open
      }
    }
  }, [isOpen, todoItem, reset]);

  // Effect to display validation errors as toasts
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      // Only run if there are actual errors
      // Iterate over all error messages and show them as toasts
      for (const key in errors) {
        const error = errors[key as keyof TodoEditFormData];
        if (error?.message) {
          showToast(error.message, 'error');
        }
      }
    }
  }, [errors, showToast]);

  // Close the modal on 'Escape' key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleClearDeadline = useCallback(() => {
    setValue('deadline', null, { shouldDirty: true, shouldValidate: true }); // Clear deadline and mark form as dirty
  }, [setValue]);

  // Handle saving the form data
  const onSubmit: SubmitHandler<TodoEditFormData> = async data => {
    if (!todoItem) return;

    // Convert Date to Timestamp before saving
    const updates: Partial<TodoItem> = {
      text: data.text,
      description: data.description ? data.description : null,
      deadline: data.deadline ? Timestamp.fromDate(data.deadline) : null,
    };

    try {
      await onSave(todoItem.id, updates);
      showToast('Task updated successfully!', 'success');
      onClose();
    } catch {
      showToast('Failed to save task updates.', 'error');
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
            {' '}
            {/* Wrap content in a form tag */}
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <div className="flex gap-3 items-center">
                <FiEdit className="w-5 h-5 text-white" />
                <h2 className="text-xl font-semibold text-white">Edit Task</h2>
              </div>
              <button
                type="button" // Important: set type="button" to prevent form submission
                className="p-1.5 text-white/60 rounded-full hover:bg-white/10 hover:text-white cursor-pointer"
                onClick={onClose}
                aria-label="Close modal"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="task-text" className="block mb-2 text-sm font-medium text-white/70">
                  Task <span className="text-red-400">*</span>
                </label>
                <input
                  id="task-text"
                  type="text"
                  {...register('text')} // Register the input with react-hook-form
                  placeholder="Task title"
                  className="p-3 w-full text-base text-white rounded-md border bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                  autoFocus
                />
              </div>
              <div>
                <label
                  htmlFor="task-description"
                  className="block mb-2 text-sm font-medium text-white/70"
                >
                  Notes (Optional)
                </label>
                <textarea
                  id="task-description"
                  {...register('description')} // Register the textarea
                  rows={3}
                  placeholder="Add more details..."
                  className="p-3 w-full text-base text-white rounded-md border resize-none bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div>
                <label htmlFor="deadline" className="block mb-2 text-sm font-medium text-white/70">
                  <FiCalendar className="inline mr-1 -mt-0.5" /> Deadline (Optional)
                </label>
                <div className="flex relative gap-2 items-center">
                  <button
                    type="button" // Prevent form submission
                    onClick={() => setIsPickerOpen(true)}
                    className="p-3 w-full text-base text-left text-white rounded-md border bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
                  >
                    {currentDeadline ? (
                      format(currentDeadline, "MMMM d,yyyy 'at' h:mm a")
                    ) : (
                      <span className="text-white/50">Set a deadline</span>
                    )}
                  </button>
                  {currentDeadline && (
                    <button
                      type="button" // Prevent form submission
                      onClick={handleClearDeadline}
                      className="p-3 rounded-md text-red-400/80 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                      aria-label="Clear deadline"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/10">
              <button
                type="submit" // Set type="submit" for form submission
                // FIX: Button disabled when submitting OR not dirty OR not valid
                disabled={isSubmitting || !isDirty || !isValid}
                className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FiSave />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <DateTimePicker
        isOpen={isPickerOpen}
        value={currentDeadline ?? null} // <--- FIXED: Ensure value is Date | null
        onChange={date => {
          setValue('deadline', date, { shouldValidate: true, shouldDirty: true });
        }}
        onClose={() => setIsPickerOpen(false)}
        mode="datetime"
      />
    </>
  );
};

export default TodoEditModal;
