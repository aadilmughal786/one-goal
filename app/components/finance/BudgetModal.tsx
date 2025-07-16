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
import { FiCheck, FiChevronDown, FiEdit3, FiLoader, FiX } from 'react-icons/fi';
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
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

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
        className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm cursor-pointer bg-black/50"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-modal-title"
      >
        <div
          className="w-full max-w-md rounded-3xl border shadow-2xl backdrop-blur-md cursor-auto bg-bg-secondary border-border-primary"
          onClick={e => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary">
              <h2 id="budget-modal-title" className="text-xl font-semibold text-text-primary">
                {isEditMode ? 'Edit' : 'Create'} Budget
              </h2>
              <button
                type="button"
                className="p-1.5 rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary focus:outline-none cursor-pointer"
                onClick={onClose}
                aria-label="Close modal"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary">
                  Category
                </label>
                <input
                  {...register('category')}
                  placeholder="e.g., Groceries, Transport"
                  className="p-3 w-full rounded-md border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary">Amount</label>
                <input
                  type="number"
                  {...register('amount')}
                  placeholder="500"
                  className="p-3 w-full rounded-md border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary">
                  <FiEdit3 className="inline -mt-1 mr-1" />
                  Period
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                    className="flex justify-between items-center px-4 py-3 w-full text-lg text-left rounded-md border cursor-pointer text-text-primary bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-border-accent"
                    aria-haspopup="listbox"
                    aria-expanded={isPeriodDropdownOpen}
                  >
                    {watch('period').charAt(0).toUpperCase() +
                      watch('period').slice(1).toLowerCase()}
                    <FiChevronDown
                      className={`transition-transform duration-200 ${isPeriodDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isPeriodDropdownOpen && (
                    <div
                      className="absolute bottom-full mb-2 p-2 w-full rounded-md border shadow-lg bg-bg-primary border-border-primary"
                      role="listbox"
                    >
                      {Object.values(BudgetPeriod).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setValue('period', p, { shouldDirty: true, shouldValidate: true });
                            setIsPeriodDropdownOpen(false);
                          }}
                          className="flex gap-3 items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                          role="option"
                          aria-selected={watch('period') === p}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {period === BudgetPeriod.CUSTOM && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-text-secondary">
                      Start Date
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsStartPickerOpen(true)}
                      className="p-3 w-full text-left rounded-lg border cursor-pointer bg-bg-primary border-border-primary"
                    >
                      {watch('startDate') ? watch('startDate')?.toLocaleDateString() : 'Select'}
                    </button>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-text-secondary">
                      End Date
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsEndPickerOpen(true)}
                      className="p-3 w-full text-left rounded-lg border cursor-pointer bg-bg-primary border-border-primary"
                    >
                      {watch('endDate') ? watch('endDate')?.toLocaleDateString() : 'Select'}
                    </button>
                  </div>
                </div>
              )}
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
                    <span>{isEditMode ? 'Save Changes' : 'Create Budget'}</span>
                  </>
                )}
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
