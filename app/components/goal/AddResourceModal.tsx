// app/components/resources/AddResourceModal.tsx
'use client';

import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Resource, ResourceType } from '@/types';
import { resourceFormSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FiCheck, FiLoader, FiX } from 'react-icons/fi';
import { z } from 'zod';

type ResourceFormData = z.infer<typeof resourceFormSchema>;

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceToEdit?: Resource | null;
}

const AddResourceModal: React.FC<AddResourceModalProps> = ({ isOpen, onClose, resourceToEdit }) => {
  const { addResource, updateResource } = useGoalStore();
  const { showToast } = useNotificationStore();
  const isEditMode = !!resourceToEdit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormSchema),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && resourceToEdit) {
        reset(resourceToEdit);
      } else {
        reset({
          url: '',
          title: '',
          description: '',
          type: ResourceType.ARTICLE,
        });
      }
    }
  }, [isOpen, isEditMode, resourceToEdit, reset]);

  useEffect(() => {
    Object.values(errors).forEach(error => {
      if (error?.message) {
        showToast(error.message, 'error');
      }
    });
  }, [errors, showToast]);

  const onSubmit: SubmitHandler<ResourceFormData> = async data => {
    try {
      if (isEditMode && resourceToEdit) {
        await updateResource(resourceToEdit.id, data);
        showToast('Resource updated!', 'success');
      } else {
        await addResource(data.url, data.title, data.description, data.type);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save resource:', error);
      showToast('Failed to save resource.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">
              {isEditMode ? 'Edit Resource' : 'Add New Resource'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-white/60 hover:bg-white/10"
            >
              <FiX />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block mb-2 text-sm text-white/70">URL *</label>
              <input
                {...register('url')}
                placeholder="https://example.com"
                className="p-3 w-full text-white rounded-lg border bg-black/20 border-white/10 focus:ring-2 focus:ring-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-white/70">Title *</label>
              <input
                {...register('title')}
                placeholder="My Awesome Resource"
                className="p-3 w-full text-white rounded-lg border bg-black/20 border-white/10 focus:ring-2 focus:ring-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-white/70">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="A short summary of the resource..."
                className="p-3 w-full text-white rounded-lg border resize-none bg-black/20 border-white/10 focus:ring-2 focus:ring-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-white/70">Type *</label>
              <select
                {...register('type')}
                className="p-3 w-full text-white rounded-lg border appearance-none bg-black/20 border-white/10 focus:ring-2 focus:ring-white focus:outline-none"
              >
                <option value={ResourceType.ARTICLE}>Article</option>
                <option value={ResourceType.IMAGE}>Image</option>
                <option value={ResourceType.VIDEO}>Video</option>
                <option value={ResourceType.OTHER}>Other</option>
              </select>
            </div>
          </div>
          <div className="p-6 border-t border-white/10">
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="inline-flex gap-2 justify-center items-center py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 hover:bg-white/90 disabled:opacity-60"
            >
              {isSubmitting ? <FiLoader className="animate-spin" /> : <FiCheck />}
              <span>{isEditMode ? 'Save Changes' : 'Add Resource'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddResourceModal;
