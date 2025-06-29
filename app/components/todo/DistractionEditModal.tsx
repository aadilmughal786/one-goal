// app/components/todo/DistractionEditModal.tsx
'use client';

import { useNotificationStore } from '@/store/useNotificationStore';
import { DistractionItem } from '@/types';
import React, { useEffect } from 'react';
import { FiEdit, FiLoader, FiSave, FiX } from 'react-icons/fi';

import { distractionEditFormSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

type DistractionEditFormData = z.infer<typeof distractionEditFormSchema>;

interface DistractionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  distractionItem: DistractionItem | null;
  onSave: (id: string, updates: Partial<DistractionItem>) => Promise<void>;
}

const DistractionEditModal: React.FC<DistractionEditModalProps> = ({
  isOpen,
  onClose,
  distractionItem,
  onSave,
}) => {
  const showToast = useNotificationStore(state => state.showToast);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<DistractionEditFormData>({
    resolver: zodResolver(distractionEditFormSchema),
    defaultValues: {
      title: '',
      description: '',
      triggerPatterns: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (isOpen && distractionItem) {
      reset(
        {
          title: distractionItem.title,
          description: distractionItem.description || '',
          triggerPatterns: (distractionItem.triggerPatterns || []).join(', '),
        },
        { keepDirty: false }
      );
    }
  }, [isOpen, distractionItem, reset]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      for (const key in errors) {
        const error = errors[key as keyof DistractionEditFormData];
        if (error?.message) {
          showToast(error.message, 'error');
        }
      }
    }
  }, [errors, showToast]);

  const onSubmit: SubmitHandler<DistractionEditFormData> = async data => {
    if (!distractionItem) return;

    const patterns = data.triggerPatterns ? data.triggerPatterns.split(',').map(p => p.trim()) : [];

    const updates: Partial<DistractionItem> = {
      title: data.title,
      description: data.description || null,
      triggerPatterns: patterns,
    };

    try {
      await onSave(distractionItem.id, updates);
      showToast('Distraction updated successfully!', 'success');
      onClose();
    } catch {
      showToast('Failed to save distraction updates.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
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
              <FiEdit className="w-5 h-5 text-white" />
              <h2 className="text-xl font-semibold text-white">Edit Distraction</h2>
            </div>
            <button
              type="button"
              className="p-1.5 text-white/60 rounded-full hover:bg-white/10 hover:text-white cursor-pointer"
              onClick={onClose}
              aria-label="Close modal"
            >
              <FiX size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label
                htmlFor="distraction-title"
                className="block mb-2 text-sm font-medium text-white/70"
              >
                Distraction / Habit <span className="text-red-400">*</span>
              </label>
              <input
                id="distraction-title"
                type="text"
                {...register('title')}
                className="p-3 w-full text-base text-white rounded-md border bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="distraction-description"
                className="block mb-2 text-sm font-medium text-white/70"
              >
                Description (Optional)
              </label>
              <textarea
                id="distraction-description"
                {...register('description')}
                rows={3}
                placeholder="Why is this a distraction for you?"
                className="p-3 w-full text-base text-white rounded-md border resize-none bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <label
                htmlFor="distraction-patterns"
                className="block mb-2 text-sm font-medium text-white/70"
              >
                Trigger Patterns (Optional, comma-separated)
              </label>
              <input
                id="distraction-patterns"
                type="text"
                {...register('triggerPatterns')}
                placeholder="e.g., feeling tired, bored, after lunch"
                className="p-3 w-full text-base text-white rounded-md border bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>
          <div className="p-6 border-t border-white/10">
            <button
              type="submit"
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
  );
};

export default DistractionEditModal;
