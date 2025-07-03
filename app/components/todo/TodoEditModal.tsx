// app/components/todo/TodoEditModal.tsx
'use client';

import { DateTimePicker } from '@/components/common/DateTimePicker';
import { useNotificationStore } from '@/store/useNotificationStore';
import { TodoItem } from '@/types';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { FiCalendar, FiEdit, FiLoader, FiSave, FiTrash2, FiX } from 'react-icons/fi';

import { todoEditFormSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

type TodoEditFormData = z.infer<typeof todoEditFormSchema>;

interface TodoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  todoItem: TodoItem | null;
  onSave: (id: string, updates: Partial<TodoItem>) => Promise<void>;
}

const TodoEditModal: React.FC<TodoEditModalProps> = ({ isOpen, onClose, todoItem, onSave }) => {
  const showToast = useNotificationStore(state => state.showToast);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<TodoEditFormData>({
    resolver: zodResolver(todoEditFormSchema),
    defaultValues: {
      text: '',
      description: '',
      deadline: null,
    },
    mode: 'onTouched',
  });

  const currentDeadline = watch('deadline');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (todoItem) {
        reset(
          {
            text: todoItem.text,
            description: todoItem.description || '',
            deadline: todoItem.deadline ? todoItem.deadline.toDate() : null,
          },
          { keepDirty: false }
        );
      } else {
        reset(
          {
            text: '',
            description: '',
            deadline: null,
          },
          { keepDirty: false }
        );
      }
    }
  }, [isOpen, todoItem, reset]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      for (const key in errors) {
        const error = errors[key as keyof TodoEditFormData];
        if (error?.message) {
          showToast(error.message, 'error');
        }
      }
    }
  }, [errors, showToast]);

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
    setValue('deadline', null, { shouldDirty: true, shouldValidate: true });
  }, [setValue]);

  const onSubmit: SubmitHandler<TodoEditFormData> = async data => {
    if (!todoItem) return;

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
          className="w-full max-w-md rounded-3xl border shadow-2xl backdrop-blur-md bg-bg-secondary border-border-primary"
          onClick={e => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex justify-between items-center p-6 border-b border-border-primary">
              <div className="flex gap-3 items-center">
                <FiEdit className="w-5 h-5 text-text-primary" />
                <h2 className="text-xl font-semibold text-text-primary">Edit Task</h2>
              </div>
              <button
                type="button"
                className="p-1.5 text-text-tertiary rounded-full hover:bg-bg-tertiary hover:text-text-primary cursor-pointer"
                onClick={onClose}
                aria-label="Close modal"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="task-text"
                  className="block mb-2 text-sm font-medium text-text-secondary"
                >
                  Task <span className="text-red-400">*</span>
                </label>
                <input
                  id="task-text"
                  type="text"
                  {...register('text')}
                  placeholder="Task title"
                  className="p-3 w-full text-base rounded-md border text-text-primary bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-border-accent"
                  autoFocus
                />
              </div>
              <div>
                <label
                  htmlFor="task-description"
                  className="block mb-2 text-sm font-medium text-text-secondary"
                >
                  Notes (Optional)
                </label>
                <textarea
                  id="task-description"
                  {...register('description')}
                  rows={3}
                  placeholder="Add more details..."
                  className="p-3 w-full text-base rounded-md border resize-none text-text-primary bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-border-accent"
                />
              </div>
              <div>
                <label
                  htmlFor="deadline"
                  className="block mb-2 text-sm font-medium text-text-secondary"
                >
                  <FiCalendar className="inline mr-1 -mt-0.5" /> Deadline (Optional)
                </label>
                <div className="flex relative gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(true)}
                    className="p-3 w-full text-base text-left rounded-md border cursor-pointer text-text-primary bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-border-accent"
                  >
                    {currentDeadline ? (
                      format(currentDeadline, "MMMM d,yyyy 'at' h:mm a")
                    ) : (
                      <span className="text-text-muted">Set a deadline</span>
                    )}
                  </button>
                  {currentDeadline && (
                    <button
                      type="button"
                      onClick={handleClearDeadline}
                      className="p-3 rounded-md cursor-pointer text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
                      aria-label="Clear deadline"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border-primary">
              <button
                type="submit"
                disabled={isSubmitting || !isDirty || !isValid}
                className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold rounded-full transition-all duration-200 cursor-pointer text-bg-primary bg-text-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-border-accent disabled:opacity-60"
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
        value={currentDeadline ?? null}
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
