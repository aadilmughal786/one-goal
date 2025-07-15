// app/components/finance/SubscriptionTab.tsx
'use client';

import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { Subscription } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FaPiggyBank } from 'react-icons/fa';
import { FiEdit, FiExternalLink, FiPlus, FiRepeat, FiTrash2 } from 'react-icons/fi';
import SubscriptionModal from './SubscriptionModal';

const SubscriptionCard = ({
  subscription,
  budgetCategory,
  currency = '$',
}: {
  subscription: Subscription;
  budgetCategory: string;
  currency?: string;
}) => {
  const { deleteSubscription } = useSubscriptionStore();
  const { showConfirmation } = useNotificationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = () => {
    showConfirmation({
      title: `Delete "${subscription.name}"?`,
      message: 'Are you sure you want to delete this subscription? This action cannot be undone.',
      action: () => deleteSubscription(subscription.id),
    });
  };

  return (
    <>
      <div className="flex flex-col justify-between p-6 h-full rounded-2xl border shadow-md bg-bg-secondary border-border-primary">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-text-primary">{subscription.name}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 text-text-secondary hover:text-text-primary"
              >
                <FiEdit />
              </button>
              <button onClick={handleDelete} className="p-2 text-text-secondary hover:text-red-500">
                <FiTrash2 />
              </button>
            </div>
          </div>
          <p className="text-sm text-text-tertiary">{budgetCategory}</p>
          <div className="my-4">
            <p className="text-3xl font-bold text-text-primary">
              {currency}
              {subscription.amount.toFixed(2)}
            </p>
            <p className="text-sm capitalize text-text-secondary">
              per {subscription.billingCycle.replace('ly', '')}
            </p>
          </div>
          <p className="text-sm text-text-secondary">
            Next payment: {format(subscription.nextBillingDate.toDate(), 'MMM d, yyyy')}
          </p>
        </div>
        {subscription.cancellationUrl && (
          <a
            href={subscription.cancellationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-2 justify-center items-center mt-4 text-blue-500 hover:underline"
          >
            Cancellation Link <FiExternalLink />
          </a>
        )}
      </div>
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subscriptionToEdit={subscription}
      />
    </>
  );
};

const SubscriptionTab = () => {
  const { appState } = useGoalStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const financeData = useMemo(() => {
    if (!appState?.activeGoalId) return null;
    return appState.goals[appState.activeGoalId]?.financeData;
  }, [appState]);

  const subscriptions = useMemo(() => {
    const sorted = financeData?.subscriptions?.slice() || [];
    sorted.sort((a, b) => a.nextBillingDate.toMillis() - b.nextBillingDate.toMillis());
    return sorted;
  }, [financeData]);
  const budgets = useMemo(() => financeData?.budgets || [], [financeData]);
  const budgetMap = useMemo(() => new Map(budgets.map(b => [b.id, b.category])), [budgets]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-text-primary">Subscriptions</h2>
        {budgets.length > 0 ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex gap-2 items-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
          >
            <FiPlus />
            Add Subscription
          </button>
        ) : (
          <Link
            href="/finance?tab=budgets"
            className="flex gap-2 items-center px-4 py-2 font-semibold text-white bg-orange-500 rounded-lg transition-colors hover:bg-orange-600"
          >
            <FaPiggyBank />
            Create a Budget First
          </Link>
        )}
      </div>

      {subscriptions.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map(sub => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              budgetCategory={budgetMap.get(sub.budgetId) || 'Uncategorized'}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-2xl border bg-bg-secondary border-border-primary">
          <FiRepeat className="mx-auto mb-4 text-5xl text-text-muted" />
          <h3 className="text-xl font-semibold text-text-primary">No Subscriptions Tracked</h3>
          <p className="mt-2 text-text-secondary">
            Click &quot;Add Subscription&quot; to keep track of your recurring payments.
          </p>
        </div>
      )}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subscriptionToEdit={null}
      />
    </div>
  );
};

export default SubscriptionTab;
