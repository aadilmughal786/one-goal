// app/components/finance/BudgetModal.tsx
'use client';

import { DateTimePicker } from '@/components/common/DateTimePicker';
import { useBudgetStore } from '@/store/useBudgetStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Budget, BudgetPeriod } from '@/types';
import { budgetFormSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FiCheck, FiLoader, FiX } from 'react-icons/fi';
import { z } from 'zod';

type BudgetFormData = z.infer<typeof budgetFormSchema>;

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetToEdit: Budget | null;
}

const BudgetModal: React.FC<BudgetModalProps> = ({ isOpen, onClose, budgetToEdit }) => {
  const { addBudget, updateBudget } = useBudgetStore();
  const { showToast } = useNotificationStore();
  const isEditMode = !!budgetToEdit;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: '',
      amount: 0,
      period: BudgetPeriod.MONTHLY,
      startDate: null,
      endDate: null,
    },
    mode: 'onTouched',
  });

  const period = watch('period');
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && budgetToEdit) {
        reset({
          category: budgetToEdit.category,
          amount: budgetToEdit.amount,
          period: budgetToEdit.period,
          startDate: budgetToEdit.startDate ? budgetToEdit.startDate.toDate() : null,
          endDate: budgetToEdit.endDate ? budgetToEdit.endDate.toDate() : null,
        });
      } else {
        reset({
          category: '',
          amount: 0,
          period: BudgetPeriod.MONTHLY,
          startDate: null,
          endDate: null,
        });
      }
    }
  }, [isOpen, isEditMode, budgetToEdit, reset]);

  useEffect(() => {
    Object.values(errors).forEach(error => {
      if (error?.message) {
        showToast(error.message, 'error');
      }
    });
  }, [errors, showToast]);

  const onSubmit: SubmitHandler<BudgetFormData> = async data => {
    const budgetData = {
      category: data.category,
      amount: data.amount,
      period: data.period,
      startDate: data.startDate ? Timestamp.fromDate(data.startDate) : null,
      endDate: data.endDate ? Timestamp.fromDate(data.endDate) : null,
    };

    try {
      if (isEditMode && budgetToEdit) {
        await updateBudget(budgetToEdit.id, budgetData);
      } else {
        await addBudget(budgetData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save budget:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
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
                {isEditMode ? 'Edit' : 'Create'} Budget
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
              <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary">
                  Category
                </label>
                <input
                  {...register('category')}
                  placeholder="e.g., Groceries, Transport"
                  className="p-3 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary">Amount</label>
                <input
                  type="number"
                  {...register('amount')}
                  placeholder="500"
                  className="p-3 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary">Period</label>
                <select
                  {...register('period')}
                  className="p-3 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
                >
                  {Object.values(BudgetPeriod).map(p => (
                    <option key={p} value={p} className="capitalize">
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              {period === BudgetPeriod.CUSTOM && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm text-text-secondary">Start Date</label>
                    <button
                      type="button"
                      onClick={() => setIsStartPickerOpen(true)}
                      className="p-3 w-full text-left rounded-lg border bg-bg-primary border-border-primary"
                    >
                      {watch('startDate') ? watch('startDate')?.toLocaleDateString() : 'Select'}
                    </button>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-text-secondary">End Date</label>
                    <button
                      type="button"
                      onClick={() => setIsEndPickerOpen(true)}
                      className="p-3 w-full text-left rounded-lg border bg-bg-primary border-border-primary"
                    >
                      {watch('endDate') ? watch('endDate')?.toLocaleDateString() : 'Select'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting || !isDirty || !isValid}
                className="flex gap-2 justify-center items-center py-3 w-full text-lg font-semibold rounded-full text-bg-primary bg-text-primary hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? <FiLoader className="animate-spin" /> : <FiCheck />}
                {isEditMode ? 'Save Changes' : 'Create Budget'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <DateTimePicker
        isOpen={isStartPickerOpen}
        onClose={() => setIsStartPickerOpen(false)}
        value={watch('startDate')}
        onChange={date => setValue('startDate', date, { shouldDirty: true, shouldValidate: true })}
        mode="date"
      />
      <DateTimePicker
        isOpen={isEndPickerOpen}
        onClose={() => setIsEndPickerOpen(false)}
        value={watch('endDate')}
        onChange={date => setValue('endDate', date, { shouldDirty: true, shouldValidate: true })}
        mode="date"
      />
    </>
  );
};

export default BudgetModal;
