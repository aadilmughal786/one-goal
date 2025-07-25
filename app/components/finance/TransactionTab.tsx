// app/components/finance/TransactionTab.tsx
'use client';

import CurrencyTooltip from '@/components/common/CurrencyTooltip';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { Transaction } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FaPiggyBank } from 'react-icons/fa';
import { FiCreditCard, FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';
import TransactionModal from './TransactionModal';

const TransactionRow = ({
  transaction,
  budgetCategory,
  onEdit,
  currency = '₹',
}: {
  transaction: Transaction;
  budgetCategory: string;
  onEdit: () => void;
  currency?: string;
}) => {
  const { deleteTransaction } = useTransactionStore();
  const { showConfirmation } = useNotificationStore();

  const handleDelete = () => {
    showConfirmation({
      title: 'Delete Transaction?',
      message: `Are you sure you want to delete the transaction: "${transaction.description}"? This action cannot be undone.`,
      action: () => deleteTransaction(transaction.id),
    });
  };

  const amountColor = transaction.type === 'income' ? 'text-green-500' : 'text-red-500';

  return (
    <tr className="border-b border-border-primary hover:bg-bg-tertiary">
      <td className="p-4">{format(transaction.date.toDate(), 'MMM d, yyyy')}</td>
      <td className="p-4">{transaction.description}</td>
      <td className="p-4">{budgetCategory}</td>
      <td className={`p-4 font-semibold ${amountColor}`}>
        {transaction.type === 'income' ? '+' : '-'}
        <CurrencyTooltip amount={transaction.amount} fromCurrency="INR">
          {currency}
          {transaction.amount.toFixed(2)}
        </CurrencyTooltip>
      </td>
      <td className="p-4 text-right">
        <div className="flex gap-2 justify-end">
          <button
            onClick={onEdit}
            className="p-2 cursor-pointer text-text-secondary hover:text-text-primary"
          >
            <FiEdit />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 cursor-pointer text-text-secondary hover:text-red-500"
          >
            <FiTrash2 />
          </button>
        </div>
      </td>
    </tr>
  );
};

const TransactionTab = () => {
  const { appState } = useGoalStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const financeData = useMemo(() => {
    if (!appState?.activeGoalId) return null;
    return appState.goals[appState.activeGoalId]?.financeData;
  }, [appState]);

  const transactions = useMemo(() => {
    const sorted = financeData?.transactions?.slice() || [];
    sorted.sort((a, b) => b.date.toMillis() - a.date.toMillis());
    return sorted;
  }, [financeData]);

  const budgets = useMemo(() => financeData?.budgets || [], [financeData]);
  const budgetMap = useMemo(() => new Map(budgets.map(b => [b.id, b.category])), [budgets]);

  const handleOpenModal = (transaction: Transaction | null) => {
    setTransactionToEdit(transaction);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-text-primary">Transactions</h2>
          {budgets.length > 0 ? (
            <button
              onClick={() => handleOpenModal(null)}
              className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer hover:bg-gray-200"
            >
              <FiPlus />
              Add Transaction
            </button>
          ) : (
            <Link
              href="/finance?tab=budgets"
              className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer hover:bg-gray-200"
            >
              <FaPiggyBank />
              Create a Budget First
            </Link>
          )}
        </div>

        <div className="rounded-2xl border bg-bg-secondary border-border-primary">
          <table className="w-full text-left">
            <thead className="border-b border-border-primary">
              <tr>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map(transaction => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    budgetCategory={budgetMap.get(transaction.budgetId) || 'Uncategorized'}
                    onEdit={() => handleOpenModal(transaction)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="py-20 text-center">
                      <FiCreditCard className="mx-auto mb-4 text-5xl text-text-muted" />
                      <h3 className="text-xl font-semibold text-text-primary">
                        No Transactions Logged
                      </h3>
                      <p className="mt-2 text-text-secondary">
                        Click &quot;Add Transaction&quot; to log your first income or expense.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transactionToEdit={transactionToEdit}
      />
    </>
  );
};

export default TransactionTab;
