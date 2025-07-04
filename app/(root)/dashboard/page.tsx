// app/(root)/dashboard/page.tsx
'use client';

import { format } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { IconType } from 'react-icons';
import { FiBarChart2, FiClock, FiFeather, FiGrid } from 'react-icons/fi';

import { useAuth } from '@/hooks/useAuth';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useRoutineStore } from '@/store/useRoutineStore';
import { DailyProgress } from '@/types';

import PageContentSkeleton from '@/components/common/PageContentSkeleton';
import DailyProgressModal from '@/components/dashboard/DailyProgressModal';
import DashboardAnalytics from '@/components/dashboard/DashboardAnalytics';
import DashboardMain from '@/components/dashboard/DashboardMain';
import DashboardQuotes from '@/components/dashboard/DashboardQuotes';
import TimeBlockUI from '@/components/dashboard/TimeBlockUI';

interface TabItem {
  id: string;
  label: string;
  icon: IconType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

const tabItems: TabItem[] = [
  { id: 'main', label: 'Dashboard', icon: FiGrid, component: DashboardMain },
  { id: 'timeblocks', label: 'Time Blocks', icon: FiClock, component: TimeBlockUI },
  { id: 'analytics', label: 'Analytics', icon: FiBarChart2, component: DashboardAnalytics },
  { id: 'quotes', label: 'Quotes', icon: FiFeather, component: DashboardQuotes },
];

const ConsolidatedDashboardPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading } = useAuth();

  const { appState } = useGoalStore();
  const { saveDailyProgress } = useRoutineStore();
  const showToast = useNotificationStore(state => state.showToast);

  const [isDailyProgressModalOpen, setIsDailyProgressModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setIsDailyProgressModalOpen(true);
  }, []);

  const handleSaveProgress = useCallback(
    async (progressData: Partial<DailyProgress>) => {
      try {
        await saveDailyProgress({
          ...progressData,
          date: progressData.date || format(new Date(), 'yyyy-MM-dd'),
        } as DailyProgress);
        setIsDailyProgressModalOpen(false);
        showToast('Progress saved successfully!', 'success');
      } catch (error) {
        showToast('Failed to save progress.', 'error');
        console.error(error);
      }
    },
    [saveDailyProgress, showToast]
  );

  const initialProgress = useMemo(() => {
    return selectedDate && activeGoal
      ? activeGoal.dailyProgress[format(selectedDate, 'yyyy-MM-dd')] || null
      : null;
  }, [selectedDate, activeGoal]);

  const renderActiveTabContent = () => {
    if (isLoading || isTabContentLoading) {
      return <PageContentSkeleton />;
    }

    const ActiveComponent = tabItems.find(item => item.id === activeTab)?.component;

    if (ActiveComponent) {
      if (activeTab === 'main') {
        return <DashboardMain handleDayClick={handleDayClick} />;
      }
      return <ActiveComponent />;
    }
    return <DashboardMain handleDayClick={handleDayClick} />;
  };

  return (
    <div className="flex flex-col min-h-screen text-text-primary bg-bg-primary font-poppins">
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-bg-primary/50 border-border-primary">
        <div className="flex space-x-2">
          {isLoading
            ? [...Array(tabItems.length)].map((_, i) => (
                <div key={i} className="px-4 py-3 animate-pulse">
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
                    className={`flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none
                    ${isActive ? 'text-text-primary border-border-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                    aria-label={item.label}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
        </div>
      </nav>
      <main className="flex-grow p-4 mx-auto w-full max-w-4xl md:p-8">
        <section className="py-8 w-full">{renderActiveTabContent()}</section>
      </main>
      {isDailyProgressModalOpen && selectedDate && (
        <DailyProgressModal
          isOpen={isDailyProgressModalOpen}
          onClose={() => setIsDailyProgressModalOpen(false)}
          date={selectedDate}
          initialProgress={initialProgress}
          onSave={handleSaveProgress}
        />
      )}
    </div>
  );
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageContentSkeleton />}>
      <ConsolidatedDashboardPageContent />
    </Suspense>
  );
}
