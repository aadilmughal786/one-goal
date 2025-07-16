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
import { FiCheck, FiChevronDown, FiLoader, FiX } from 'react-icons/fi';
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
  const [isBillingCycleDropdownOpen, setIsBillingCycleDropdownOpen] = useState(false);
  const [isBudgetDropdownOpen, setIsBudgetDropdownOpen] = useState(false);
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
        className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm cursor-pointer bg-black/50"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-modal-title"
      >
        <div
          className="w-full max-w-md rounded-3xl border shadow-2xl backdrop-blur-md cursor-auto bg-bg-secondary border-border-primary"
          onClick={e => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary">
              <h2 id="subscription-modal-title" className="text-xl font-semibold text-text-primary">
                {isEditMode ? 'Edit' : 'Add'} Subscription
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
                placeholder="Subscription Name (e.g., Netflix)"
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
                  onClick={() => setIsBillingCycleDropdownOpen(!isBillingCycleDropdownOpen)}
                  className="flex justify-between items-center px-4 py-3 w-full text-lg text-left rounded-md border cursor-pointer text-text-primary bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-border-accent"
                  aria-haspopup="listbox"
                  aria-expanded={isBillingCycleDropdownOpen}
                >
                  {watch('billingCycle').charAt(0).toUpperCase() +
                    watch('billingCycle').slice(1).toLowerCase()}
                  <FiChevronDown
                    className={`transition-transform duration-200 ${isBillingCycleDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isBillingCycleDropdownOpen && (
                  <div
                    className="absolute bottom-full p-2 mb-2 w-full rounded-md border shadow-lg bg-bg-primary border-border-primary"
                    role="listbox"
                  >
                    {['monthly', 'yearly', 'quarterly'].map(cycle => (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => {
                          setValue('billingCycle', cycle as Subscription['billingCycle'], {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setIsBillingCycleDropdownOpen(false);
                        }}
                        className="flex gap-3 items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                        role="option"
                        aria-selected={watch('billingCycle') === cycle}
                      >
                        {cycle}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsBudgetDropdownOpen(!isBudgetDropdownOpen)}
                  className="flex justify-between items-center px-4 py-3 w-full text-lg text-left rounded-md border cursor-pointer text-text-primary bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-border-accent"
                  aria-haspopup="listbox"
                  aria-expanded={isBudgetDropdownOpen}
                >
                  {budgets.find(b => b.id === watch('budgetId'))?.category || 'Select a Budget...'}
                  <FiChevronDown
                    className={`transition-transform duration-200 ${isBudgetDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isBudgetDropdownOpen && (
                  <div
                    className="absolute bottom-full p-2 mb-2 w-full rounded-md border shadow-lg bg-bg-primary border-border-primary"
                    role="listbox"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setValue('budgetId', '', { shouldDirty: true, shouldValidate: true });
                        setIsBudgetDropdownOpen(false);
                      }}
                      className="flex gap-3 items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                      role="option"
                      aria-selected={watch('budgetId') === ''}
                    >
                      Select a Budget...
                    </button>
                    {budgets.map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setValue('budgetId', b.id, { shouldDirty: true, shouldValidate: true });
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
              <button
                type="button"
                onClick={() => setIsNextBillingPickerOpen(true)}
                className="p-3 w-full text-left rounded-lg border cursor-pointer bg-bg-primary border-border-primary"
              >
                {/* REVISION: Added a check to prevent calling toLocaleDateString on undefined */}
                Next Billing:{' '}
                {nextBillingDateValue ? nextBillingDateValue.toLocaleDateString() : 'Select Date'}
              </button>
              <button
                type="button"
                onClick={() => setIsEndDatePickerOpen(true)}
                className="p-3 w-full text-left rounded-lg border cursor-pointer bg-bg-primary border-border-primary"
              >
                {/* REVISION: Added a check for the optional end date */}
                End Date: {endDateValue ? endDateValue.toLocaleDateString() : 'No End Date'}
              </button>
              <input
                {...register('cancellationUrl')}
                placeholder="Cancellation URL (optional)"
                className="p-3 w-full rounded-md border bg-bg-primary border-border-primary focus:ring-2 focus:ring-border-accent focus:outline-none"
              />
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
                    <span>{isEditMode ? 'Save Changes' : 'Add Subscription'}</span>
                  </>
                )}
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
