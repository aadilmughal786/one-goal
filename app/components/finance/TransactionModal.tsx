// app/components/finance/TransactionModal.tsx
'use client';

import { DateTimePicker } from '@/components/common/DateTimePicker';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { Transaction } from '@/types';
import { transactionFormSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Timestamp } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FiCheck, FiChevronDown, FiLoader, FiX } from 'react-icons/fi';
import { z } from 'zod';

type TransactionFormData = z.infer<typeof transactionFormSchema>;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit: Transaction | null;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
}) => {
  const { addTransaction, updateTransaction } = useTransactionStore();
  const { showToast } = useNotificationStore();
  const { appState } = useGoalStore();
  const isEditMode = !!transactionToEdit;

  const budgets = useMemo(() => {
    if (!appState?.activeGoalId) return [];
    return appState.goals[appState.activeGoalId]?.financeData?.budgets || [];
  }, [appState]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      type: 'expense',
      budgetId: '',
      date: new Date(),
    },
    mode: 'onTouched',
  });

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isBudgetDropdownOpen, setIsBudgetDropdownOpen] = useState(false);
  const transactionType = watch('type');

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && transactionToEdit) {
        reset({
          description: transactionToEdit.description,
          amount: transactionToEdit.amount,
          type: transactionToEdit.type,
          budgetId: transactionToEdit.budgetId,
          date: transactionToEdit.date.toDate(),
        });
      } else {
        reset({
          description: '',
          amount: 0,
          type: 'expense',
          budgetId: budgets.length > 0 ? budgets[0].id : '',
          date: new Date(),
        });
      }
    }
  }, [isOpen, isEditMode, transactionToEdit, reset, budgets]);

  useEffect(() => {
    Object.values(errors).forEach(error => {
      if (error?.message) {
        showToast(error.message, 'error');
      }
    });
  }, [errors, showToast]);

  const onSubmit: SubmitHandler<TransactionFormData> = async data => {
    const transactionData = {
      ...data,
      date: Timestamp.fromDate(data.date),
    };

    try {
      if (isEditMode && transactionToEdit) {
        await updateTransaction(transactionToEdit.id, transactionData);
      } else {
        await addTransaction(transactionData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save transaction:', error);
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
        aria-labelledby="transaction-modal-title"
      >
        <div
          className="w-full max-w-md rounded-3xl border shadow-2xl backdrop-blur-md cursor-auto bg-bg-secondary border-border-primary"
          onClick={e => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary">
              <h2 id="transaction-modal-title" className="text-xl font-semibold text-text-primary">
                {isEditMode ? 'Edit' : 'Add'} Transaction
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
              <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary">Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-bg-primary">
                  <button
                    type="button"
                    onClick={() => setValue('type', 'expense', { shouldDirty: true })}
                    className={`py-2 rounded-md font-semibold ${transactionType === 'expense' ? 'bg-red-500 text-white' : 'bg-bg-tertiary text-text-secondary'} cursor-pointer`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('type', 'income', { shouldDirty: true })}
                    className={`py-2 rounded-md font-semibold ${transactionType === 'income' ? 'bg-green-500 text-white' : 'bg-bg-tertiary text-text-secondary'} cursor-pointer`}
                  >
                    Income
                  </button>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary">
                  Description
                </label>
                <input
                  {...register('description')}
                  placeholder="e.g., Coffee, Paycheck"
                  className="p-3 w-full rounded-md border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-text-secondary">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount')}
                    placeholder="25.50"
                    className="p-3 w-full rounded-md border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-text-secondary">
                    Budget Category
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsBudgetDropdownOpen(!isBudgetDropdownOpen)}
                      className="flex justify-between items-center px-4 py-3 w-full text-lg text-left rounded-md border cursor-pointer text-text-primary bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-border-accent"
                      aria-haspopup="listbox"
                      aria-expanded={isBudgetDropdownOpen}
                    >
                      {budgets.find(b => b.id === watch('budgetId'))?.category ||
                        'Select a Budget...'}
                      <FiChevronDown
                        className={`transition-transform duration-200 ${isBudgetDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isBudgetDropdownOpen && (
                      <div
                        className="absolute bottom-full mb-2 p-2 w-full rounded-md border shadow-lg bg-bg-primary border-border-primary"
                        role="listbox"
                      >
                        {budgets.map(b => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setValue('budgetId', b.id, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                              setIsBudgetDropdownOpen(false);
                            }}
                            className="flex gap-3 items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                            role="option"
                            aria-selected={watch('budgetId') === b.id}
                          >
                            {b.category}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary">Date</label>
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(true)}
                  className="p-3 w-full text-left rounded-lg border cursor-pointer bg-bg-primary border-border-primary"
                >
                  {watch('date').toLocaleDateString()}
                </button>
              </div>
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
                    <span>{isEditMode ? 'Save Changes' : 'Add Transaction'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <DateTimePicker
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        value={watch('date')}
        onChange={date =>
          setValue('date', date || new Date(), { shouldDirty: true, shouldValidate: true })
        }
        mode="date"
      />
    </>
  );
};

export default TransactionModal;
