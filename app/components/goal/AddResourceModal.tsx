// app/components/resources/AddResourceModal.tsx
'use client';

import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Resource, ResourceType } from '@/types';
import { resourceFormSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useRef, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import {
  FiCheck,
  FiChevronDown,
  FiFileText,
  FiImage,
  FiLink,
  FiLoader,
  FiVideo,
  FiX,
} from 'react-icons/fi';
import { z } from 'zod';

type ResourceFormData = z.infer<typeof resourceFormSchema>;

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceToEdit?: Resource | null;
}

const typeOptions = [
  { value: ResourceType.ARTICLE, label: 'Article', icon: FiFileText },
  { value: ResourceType.IMAGE, label: 'Image', icon: FiImage },
  { value: ResourceType.VIDEO, label: 'Video', icon: FiVideo },
  { value: ResourceType.OTHER, label: 'Other', icon: FiLink },
];

const AddResourceModal: React.FC<AddResourceModalProps> = ({ isOpen, onClose, resourceToEdit }) => {
  const { addResource, updateResource } = useGoalStore();
  const { showToast } = useNotificationStore();
  const isEditMode = !!resourceToEdit;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormSchema),
    mode: 'onTouched',
  });

  const selectedType = watch('type');

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && resourceToEdit) {
        reset(resourceToEdit);
      } else {
        reset({
          url: '',
          title: '',
          type: ResourceType.ARTICLE,
        });
      }
      setIsDropdownOpen(false);
    }
  }, [isOpen, isEditMode, resourceToEdit, reset]);

  useEffect(() => {
    Object.values(errors).forEach(error => {
      if (error?.message) {
        showToast(error.message, 'error');
      }
    });
  }, [errors, showToast]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onSubmit: SubmitHandler<ResourceFormData> = async data => {
    try {
      if (isEditMode && resourceToEdit) {
        await updateResource(resourceToEdit.id, data);
        showToast('Resource updated!', 'success');
      } else {
        await addResource(data.url, data.title, data.type);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save resource:', error);
      showToast('Failed to save resource.', 'error');
    }
  };

  if (!isOpen) return null;

  const selectedOption = typeOptions.find(opt => opt.value === selectedType);
  const SelectedIcon = selectedOption?.icon;

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
              <label className="block mb-2 text-sm text-white/70">Type *</label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex justify-between items-center p-3 w-full text-left text-white rounded-lg border cursor-pointer bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                >
                  {selectedOption ? (
                    <span className="flex gap-3 items-center">
                      {SelectedIcon && <SelectedIcon className="text-white/70" />}
                      {selectedOption.label}
                    </span>
                  ) : (
                    <span className="text-white/50">Select a type...</span>
                  )}
                  <FiChevronDown
                    className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isDropdownOpen && (
                  <div
                    className="absolute z-10 p-2 mt-2 w-full rounded-md border shadow-lg bg-neutral-900 border-white/10"
                    role="listbox"
                  >
                    {typeOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setValue('type', option.value, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-center w-full gap-3 px-3 py-2 text-left rounded-md transition-colors cursor-pointer hover:bg-white/10 ${
                          selectedType === option.value ? 'bg-blue-500/50' : ''
                        }`}
                        role="option"
                        aria-selected={selectedType === option.value}
                      >
                        <option.icon />
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
