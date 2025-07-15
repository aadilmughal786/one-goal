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
import { FiCheck, FiLoader, FiX } from 'react-icons/fi';
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
                {isEditMode ? 'Edit' : 'Add'} Transaction
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
                <label className="block mb-2 text-sm font-medium text-text-secondary">Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-bg-primary">
                  <button
                    type="button"
                    onClick={() => setValue('type', 'expense', { shouldDirty: true })}
                    className={`py-2 rounded-md font-semibold ${transactionType === 'expense' ? 'bg-red-500 text-white' : 'bg-bg-tertiary text-text-secondary'}`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('type', 'income', { shouldDirty: true })}
                    className={`py-2 rounded-md font-semibold ${transactionType === 'income' ? 'bg-green-500 text-white' : 'bg-bg-tertiary text-text-secondary'}`}
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
                  className="p-3 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
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
                    className="p-3 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-text-secondary">
                    Budget Category
                  </label>
                  <select
                    {...register('budgetId')}
                    className="p-3 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
                  >
                    {budgets.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-text-secondary">Date</label>
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(true)}
                  className="p-3 w-full text-left rounded-lg border bg-bg-primary border-border-primary"
                >
                  {watch('date').toLocaleDateString()}
                </button>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting || !isDirty || !isValid}
                className="flex gap-2 justify-center items-center py-3 w-full text-lg font-semibold rounded-full text-bg-primary bg-text-primary hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? <FiLoader className="animate-spin" /> : <FiCheck />}
                {isEditMode ? 'Save Changes' : 'Add Transaction'}
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
