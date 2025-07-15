// app/components/finance/SubscriptionModal.tsx
'use client';

import { DateTimePicker } from '@/components/common/DateTimePicker';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { Subscription } from '@/types';
import { subscriptionFormSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Timestamp } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FiCheck, FiLoader, FiX } from 'react-icons/fi';
import { z } from 'zod';

type SubscriptionFormData = z.infer<typeof subscriptionFormSchema>;

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionToEdit: Subscription | null;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscriptionToEdit,
}) => {
  const { addSubscription, updateSubscription } = useSubscriptionStore();
  const { showToast } = useNotificationStore();
  const { appState } = useGoalStore();
  const isEditMode = !!subscriptionToEdit;

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
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionFormSchema),
    // REVISION: Provided default values directly to the hook to prevent initial render errors.
    defaultValues: {
      name: '',
      amount: 0,
      billingCycle: 'monthly',
      nextBillingDate: new Date(),
      endDate: null,
      cancellationUrl: '',
      notes: '',
      budgetId: budgets.length > 0 ? budgets[0].id : '',
    },
    mode: 'onTouched',
  });

  const [isNextBillingPickerOpen, setIsNextBillingPickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const nextBillingDateValue = watch('nextBillingDate');
  const endDateValue = watch('endDate');

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && subscriptionToEdit) {
        reset({
          name: subscriptionToEdit.name,
          amount: subscriptionToEdit.amount,
          billingCycle: subscriptionToEdit.billingCycle,
          nextBillingDate: subscriptionToEdit.nextBillingDate.toDate(),
          endDate: subscriptionToEdit.endDate ? subscriptionToEdit.endDate.toDate() : null,
          cancellationUrl: subscriptionToEdit.cancellationUrl || '',
          notes: subscriptionToEdit.notes || '',
          budgetId: subscriptionToEdit.budgetId,
        });
      } else {
        reset({
          name: '',
          amount: 0,
          billingCycle: 'monthly',
          nextBillingDate: new Date(),
          endDate: null,
          cancellationUrl: '',
          notes: '',
          budgetId: budgets.length > 0 ? budgets[0].id : '',
        });
      }
    }
  }, [isOpen, isEditMode, subscriptionToEdit, reset, budgets]);

  useEffect(() => {
    Object.values(errors).forEach(error => {
      if (error?.message) {
        showToast(error.message, 'error');
      }
    });
  }, [errors, showToast]);

  const onSubmit: SubmitHandler<SubscriptionFormData> = async data => {
    const subscriptionData = {
      ...data,
      cancellationUrl: data.cancellationUrl || null,
      notes: data.notes || null,
      nextBillingDate: Timestamp.fromDate(data.nextBillingDate),
      endDate: data.endDate ? Timestamp.fromDate(data.endDate) : null,
    };

    try {
      if (isEditMode && subscriptionToEdit) {
        await updateSubscription(subscriptionToEdit.id, subscriptionData);
      } else {
        await addSubscription(subscriptionData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save subscription:', error);
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
                {isEditMode ? 'Edit' : 'Add'} Subscription
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-text-tertiary hover:bg-bg-tertiary"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <input
                {...register('name')}
                placeholder="Subscription Name (e.g., Netflix)"
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
                {...register('billingCycle')}
                className="p-3 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="quarterly">Quarterly</option>
              </select>
              <select
                {...register('budgetId')}
                className="p-3 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
              >
                <option value="">Select a Budget...</option>
                {budgets.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.category}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsNextBillingPickerOpen(true)}
                className="p-3 w-full text-left rounded-lg border bg-bg-primary border-border-primary"
              >
                {/* REVISION: Added a check to prevent calling toLocaleDateString on undefined */}
                Next Billing:{' '}
                {nextBillingDateValue ? nextBillingDateValue.toLocaleDateString() : 'Select Date'}
              </button>
              <button
                type="button"
                onClick={() => setIsEndDatePickerOpen(true)}
                className="p-3 w-full text-left rounded-lg border bg-bg-primary border-border-primary"
              >
                {/* REVISION: Added a check for the optional end date */}
                End Date: {endDateValue ? endDateValue.toLocaleDateString() : 'No End Date'}
              </button>
              <input
                {...register('cancellationUrl')}
                placeholder="Cancellation URL (optional)"
                className="p-3 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
              />
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
                {isEditMode ? 'Save Changes' : 'Add Subscription'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <DateTimePicker
        isOpen={isNextBillingPickerOpen}
        onClose={() => setIsNextBillingPickerOpen(false)}
        value={nextBillingDateValue}
        onChange={date =>
          setValue('nextBillingDate', date || new Date(), {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        mode="date"
      />
      <DateTimePicker
        isOpen={isEndDatePickerOpen}
        onClose={() => setIsEndDatePickerOpen(false)}
        value={endDateValue}
        onChange={date => setValue('endDate', date, { shouldDirty: true, shouldValidate: true })}
        mode="date"
      />
    </>
  );
};

export default SubscriptionModal;
