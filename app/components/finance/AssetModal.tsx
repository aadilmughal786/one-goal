// app/components/finance/AssetModal.tsx
'use client';

import { useNetWorthStore } from '@/store/useNetWorthStore';
import { Asset, AssetType } from '@/types';
import { assetFormSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FiCheck, FiChevronDown, FiLoader, FiX } from 'react-icons/fi';
import { z } from 'zod';

type AssetFormData = z.infer<typeof assetFormSchema>;

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: Asset | null;
}

const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, itemToEdit }) => {
  const { addAsset, updateAsset } = useNetWorthStore();
  const isEditMode = !!itemToEdit;

  const [isAssetTypeDropdownOpen, setIsAssetTypeDropdownOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting, isValid, isDirty },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
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
          type: AssetType.CASH,
          notes: '',
        });
      }
    }
  }, [isOpen, isEditMode, itemToEdit, reset]);

  const onSubmit: SubmitHandler<AssetFormData> = async data => {
    try {
      if (isEditMode && itemToEdit) {
        await updateAsset(itemToEdit.id, data);
      } else {
        await addAsset(data);
      }
      onClose();
    } catch (error) {
      console.error(`Failed to save asset:`, error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm cursor-pointer bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-modal-title"
    >
      <div
        className="w-full max-w-md rounded-3xl border shadow-2xl backdrop-blur-md cursor-auto bg-bg-secondary border-border-primary"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary">
            <h2 id="asset-modal-title" className="text-xl font-semibold text-text-primary">
              {isEditMode ? 'Edit' : 'Add'} Asset
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
              placeholder="e.g., Savings Account"
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
                onClick={() => setIsAssetTypeDropdownOpen(!isAssetTypeDropdownOpen)}
                className="flex justify-between items-center px-4 py-3 w-full text-lg text-left rounded-md border cursor-pointer text-text-primary bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-border-accent"
                aria-haspopup="listbox"
                aria-expanded={isAssetTypeDropdownOpen}
              >
                {(watch('type') || '').replace('_', ' ').charAt(0).toUpperCase() +
                  (watch('type') || '').replace('_', ' ').slice(1).toLowerCase()}
                <FiChevronDown
                  className={`transition-transform duration-200 ${isAssetTypeDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isAssetTypeDropdownOpen && (
                <div
                  className="absolute z-10 p-2 mt-2 w-full rounded-md border shadow-lg bg-bg-primary border-border-primary"
                  role="listbox"
                >
                  {Object.values(AssetType).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setValue('type', type, { shouldValidate: true, shouldDirty: true });
                        setIsAssetTypeDropdownOpen(false);
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
                  <span>{isEditMode ? 'Save Changes' : 'Add Asset'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetModal;
