// app/components/finance/LiabilityModal.tsx
'use client';

import { useNetWorthStore } from '@/store/useNetWorthStore';
import { Liability, LiabilityType } from '@/types';
import { liabilityFormSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FiCheck, FiChevronDown, FiLoader, FiX } from 'react-icons/fi';
import { z } from 'zod';

type LiabilityFormData = z.infer<typeof liabilityFormSchema>;

interface LiabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: Liability | null;
}

const LiabilityModal: React.FC<LiabilityModalProps> = ({ isOpen, onClose, itemToEdit }) => {
  const { addLiability, updateLiability } = useNetWorthStore();
  const isEditMode = !!itemToEdit;

  const [isLiabilityTypeDropdownOpen, setIsLiabilityTypeDropdownOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting, isValid, isDirty },
  } = useForm<LiabilityFormData>({
    resolver: zodResolver(liabilityFormSchema),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && itemToEdit) {
        reset(itemToEdit);
      } else {
        reset({
          name: '',
          amount: 0,
          type: LiabilityType.OTHER,
          notes: '',
        });
      }
    }
  }, [isOpen, isEditMode, itemToEdit, reset]);

  const onSubmit: SubmitHandler<LiabilityFormData> = async data => {
    try {
      if (isEditMode && itemToEdit) {
        await updateLiability(itemToEdit.id, data);
      } else {
        await addLiability(data);
      }
      onClose();
    } catch (error) {
      console.error(`Failed to save liability:`, error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm cursor-pointer bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="liability-modal-title"
    >
      <div
        className="w-full max-w-md rounded-3xl border shadow-2xl backdrop-blur-md cursor-auto bg-bg-secondary border-border-primary"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary">
            <h2 id="liability-modal-title" className="text-xl font-semibold text-text-primary">
              {isEditMode ? 'Edit' : 'Add'} Liability
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary focus:outline-none cursor-pointer"
              aria-label="Close modal"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <input
              {...register('name')}
              placeholder="e.g., Car Loan"
              className="p-3 w-full rounded-md border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
            />
            <input
              type="number"
              step="0.01"
              {...register('amount')}
              placeholder="Amount"
              className="p-3 w-full rounded-md border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLiabilityTypeDropdownOpen(!isLiabilityTypeDropdownOpen)}
                className="flex justify-between items-center px-4 py-3 w-full text-lg text-left rounded-md border cursor-pointer text-text-primary bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-border-accent"
                aria-haspopup="listbox"
                aria-expanded={isLiabilityTypeDropdownOpen}
              >
                {(watch('type') || '').replace('_', ' ').charAt(0).toUpperCase() +
                  (watch('type') || '').replace('_', ' ').slice(1).toLowerCase()}
                <FiChevronDown
                  className={`transition-transform duration-200 ${isLiabilityTypeDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isLiabilityTypeDropdownOpen && (
                <div
                  className="absolute z-10 p-2 mt-2 w-full rounded-md border shadow-lg bg-bg-primary border-border-primary"
                  role="listbox"
                >
                  {Object.values(LiabilityType).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setValue('type', type, { shouldValidate: true, shouldDirty: true });
                        setIsLiabilityTypeDropdownOpen(false);
                      }}
                      className="flex gap-3 items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                      role="option"
                      aria-selected={watch('type') === type}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <textarea
              {...register('notes')}
              placeholder="Notes (optional)"
              className="p-3 w-full rounded-md border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
            />
          </div>

          <div className="px-6 py-4 border-t border-border-primary">
            <button
              type="submit"
              disabled={isSubmitting || !isValid || !isDirty}
              className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiCheck />
                  <span>{isEditMode ? 'Save Changes' : 'Add Liability'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LiabilityModal;
