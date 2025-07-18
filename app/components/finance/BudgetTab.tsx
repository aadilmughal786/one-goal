// app/components/finance/BudgetTab.tsx
'use client';

import { useBudgetStore } from '@/store/useBudgetStore';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Budget, Transaction } from '@/types';
import { useMemo, useState } from 'react';
import { FaPiggyBank } from 'react-icons/fa';
import { FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';
import BudgetModal from './BudgetModal';
import BudgetDistributionChart from './charts/BudgetDistributionChart'; // Import the chart
import CurrencyTooltip from '@/components/common/CurrencyTooltip';

const BudgetCard = ({
  budget,
  spent,
  onEdit,
  currency = '₹',
}: {
  budget: Budget;
  spent: number;
  onEdit: () => void;
  currency?: string;
}) => {
  const { deleteBudget } = useBudgetStore();
  const { showConfirmation } = useNotificationStore();

  const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const isOverBudget = spent > budget.amount;

  const progressColor = isOverBudget
    ? 'bg-red-500'
    : progress > 75
      ? 'bg-orange-500'
      : progress > 50
        ? 'bg-yellow-500'
        : 'bg-green-500';

  const handleDelete = () => {
    showConfirmation({
      title: `Delete "${budget.category}" Budget?`,
      message:
        'Are you sure? This will also delete all associated transactions and subscriptions. This action cannot be undone.',
      action: () => deleteBudget(budget.id),
      actionDelayMs: 5000,
    });
  };

  return (
    <div className="flex flex-col justify-between p-6 h-full rounded-2xl border shadow-md bg-bg-secondary border-border-primary">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-text-primary">{budget.category}</h3>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-2 transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
            >
              <FiEdit />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 transition-colors text-text-secondary hover:text-red-500 cursor-pointer"
            >
              <FiTrash2 />
            </button>
          </div>
        </div>
        <p className="text-sm capitalize text-text-tertiary">{budget.period} Budget</p>
        <div className="my-4">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-lg font-semibold text-text-primary">
              <CurrencyTooltip amount={spent} fromCurrency={currency}>
                {currency}
                {spent.toFixed(2)}
              </CurrencyTooltip>
            </span>
            <span className="text-sm font-medium text-text-secondary">
              of{' '}
              <CurrencyTooltip amount={budget.amount} fromCurrency={currency}>
                {currency}
                {budget.amount.toFixed(2)}
              </CurrencyTooltip>
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-bg-tertiary">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
      {isOverBudget && (
        <span className="mt-auto text-sm font-semibold text-center text-red-500">
          You are{' '}
          <CurrencyTooltip amount={spent - budget.amount} fromCurrency={currency}>
            {currency}
            {(spent - budget.amount).toFixed(2)}
          </CurrencyTooltip>{' '}
          over budget!
        </span>
      )}
    </div>
  );
};

const BudgetTab = () => {
  const { appState } = useGoalStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);

  const financeData = useMemo(() => {
    if (!appState?.activeGoalId) return null;
    return appState.goals[appState.activeGoalId]?.financeData;
  }, [appState]);

  const budgets = useMemo(() => financeData?.budgets || [], [financeData]);
  const transactions = useMemo(() => financeData?.transactions || [], [financeData]);

  const budgetSpendMap = useMemo(() => {
    const spendMap = new Map<string, number>();
    transactions.forEach((transaction: Transaction) => {
      if (transaction.type === 'expense') {
        const currentSpend = spendMap.get(transaction.budgetId) || 0;
        spendMap.set(transaction.budgetId, currentSpend + transaction.amount);
      }
    });
    return spendMap;
  }, [transactions]);

  const handleOpenModal = (budget: Budget | null) => {
    setBudgetToEdit(budget);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-text-primary">My Budgets</h2>
          <button
            onClick={() => handleOpenModal(null)}
            className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer hover:bg-gray-200"
          >
            <FiPlus />
            Add Budget
          </button>
        </div>

        {budgets.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map(budget => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                spent={budgetSpendMap.get(budget.id) || 0}
                onEdit={() => handleOpenModal(budget)}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center rounded-2xl border bg-bg-secondary border-border-primary">
            <FaPiggyBank className="mx-auto mb-4 text-5xl text-text-muted" />
            <h3 className="text-xl font-semibold text-text-primary">No Budgets Yet</h3>
            <p className="mt-2 text-text-secondary">
              Click &quot;Add Budget&quot; to create your first spending category.
            </p>
          </div>
        )}
        {/* REVISION: Added the chart component here */}
        <BudgetDistributionChart budgets={budgets} transactions={transactions} />
      </div>
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        budgetToEdit={budgetToEdit}
      />
    </>
  );
};

export default BudgetTab;
