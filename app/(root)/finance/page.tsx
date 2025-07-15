// app/(root)/finance/page.tsx
'use client';

import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import PageContentSkeleton from '@/components/common/PageContentSkeleton';
import BudgetTab from '@/components/finance/BudgetTab';
import NetWorthTab from '@/components/finance/NetWorthTab';
import SubscriptionTab from '@/components/finance/SubscriptionTab';
import TransactionTab from '@/components/finance/TransactionTab';
import { useAuth } from '@/hooks/useAuth';
import { useGoalStore } from '@/store/useGoalStore';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { IconType } from 'react-icons';
import { FaMoneyBillWave, FaPiggyBank } from 'react-icons/fa';
import { FiCreditCard, FiRepeat } from 'react-icons/fi';

interface TabItem {
  id: string;
  label: string;
  icon: IconType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

const tabItems: TabItem[] = [
  { id: 'budgets', label: 'Budgets', icon: FaPiggyBank, component: BudgetTab },
  { id: 'transactions', label: 'Transactions', icon: FiCreditCard, component: TransactionTab },
  { id: 'subscriptions', label: 'Subscriptions', icon: FiRepeat, component: SubscriptionTab },
  { id: 'networth', label: 'Net Worth', icon: FaMoneyBillWave, component: NetWorthTab },
];

const FinancePageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading } = useAuth();
  const { appState } = useGoalStore();

  const [isTabContentLoading, setIsTabContentLoading] = useState(false);
  const [activeTab, setActiveTabInternal] = useState<string>(tabItems[0].id);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const targetTab = tabItems.find(item => item.id === tabFromUrl)?.id || tabItems[0].id;
    setActiveTabInternal(targetTab);
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading) {
      setIsTabContentLoading(true);
      const timer = setTimeout(() => {
        setIsTabContentLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isLoading]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTabInternal(tabId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const activeGoal = useMemo(() => {
    if (!appState?.activeGoalId || !appState.goals) return null;
    return appState.goals[appState.activeGoalId];
  }, [appState]);

  const renderActiveTabContent = () => {
    if (isLoading || isTabContentLoading) {
      return <PageContentSkeleton />;
    }

    if (!activeGoal) {
      return <NoActiveGoalMessage />;
    }

    if (!activeGoal.financeData) {
      return (
        <div className="p-8 text-center card">
          <h2 className="text-2xl font-bold">Welcome to Your Financial Hub!</h2>
          <p className="mt-2 text-text-secondary">Get started by setting up your first budget.</p>
        </div>
      );
    }

    const ActiveComponent = tabItems.find(item => item.id === activeTab)?.component;

    if (ActiveComponent) {
      return <ActiveComponent />;
    }
    return null;
  };

  return (
    <main className="flex flex-col min-h-screen text-text-primary bg-bg-primary font-poppins">
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-bg-primary/50 border-border-primary">
        <div className="flex space-x-1 sm:space-x-2">
          {isLoading
            ? [...Array(tabItems.length)].map((_, i) => (
                <div key={i} className="px-3 py-3 animate-pulse">
                  <div className="w-24 h-6 rounded-md bg-bg-tertiary"></div>
                </div>
              ))
            : tabItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex cursor-pointer items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none
                    ${isActive ? 'text-text-primary border-border-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                    aria-label={item.label}
                  >
                    <Icon size={18} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
        </div>
      </nav>
      <div className="container flex-grow p-4 mx-auto max-w-6xl">
        <section className="py-8 w-full">{renderActiveTabContent()}</section>
      </div>
    </main>
  );
};

export default function FinancePage() {
  return (
    <Suspense fallback={<PageContentSkeleton />}>
      <FinancePageContent />
    </Suspense>
  );
}
