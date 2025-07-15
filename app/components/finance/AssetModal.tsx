// app/components/finance/AssetModal.tsx
'use client';

import { useNetWorthStore } from '@/store/useNetWorthStore';
import { Asset, AssetType } from '@/types';
import { assetFormSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FiCheck, FiLoader, FiX } from 'react-icons/fi';
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

  const {
    register,
    handleSubmit,
    reset,
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
      className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
      onClick={onClose}
    >
      <div
        className="p-6 w-full max-w-md rounded-3xl border shadow-2xl bg-bg-secondary border-border-primary"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text-primary">
              {isEditMode ? 'Edit' : 'Add'} Asset
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-text-tertiary hover:bg-bg-tertiary"
            >
              <FiX />
            </button>
          </div>

          <div className="space-y-4">
            <input
              {...register('name')}
              placeholder="e.g., Savings Account"
              className="p-3 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
            />
            <input
              type="number"
              step="0.01"
              {...register('amount')}
              placeholder="Amount"
              className="p-3 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
            />
            <select
              {...register('type')}
              className="p-3 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
            >
              {Object.values(AssetType).map(t => (
                <option key={t} value={t} className="capitalize">
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
            <textarea
              {...register('notes')}
              placeholder="Notes (optional)"
              className="p-3 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
            />
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty || !isValid}
              className="flex gap-2 justify-center items-center py-3 w-full text-lg font-semibold rounded-full text-bg-primary bg-text-primary hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? <FiLoader className="animate-spin" /> : <FiCheck />}
              {isEditMode ? 'Save Changes' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetModal;
