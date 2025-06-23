// app/(root)/dashboard/page.tsx
'use client';

import { format } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { IconType } from 'react-icons';
import { FiBarChart2, FiFeather, FiGrid } from 'react-icons/fi';

import { useAuth } from '@/hooks/useAuth';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { AppState, DailyProgress } from '@/types';

// REFACTOR: Import the new common skeleton component
import PageContentSkeleton from '@/components/common/PageContentSkeleton';
import DailyProgressModal from '@/components/dashboard/DailyProgressModal';
import DashboardAnalytics from '@/components/dashboard/DashboardAnalytics';
import DashboardMain from '@/components/dashboard/DashboardMain';
import DashboardQuotes from '@/components/dashboard/DashboardQuotes';

interface DashboardTabProps {
  isDailyProgressModalOpen: boolean;
  selectedDate: Date | null;
  handleDayClick: (date: Date) => void;
  handleSaveProgress: (progressData: Partial<DailyProgress>) => Promise<void>;
  setIsDailyProgressModalOpen: (isOpen: boolean) => void;
}

interface TabItem {
  id: string;
  label: string;
  icon: IconType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

const tabItems: TabItem[] = [
  { id: 'main', label: 'Dashboard', icon: FiGrid, component: DashboardMain },
  { id: 'analytics', label: 'Analytics', icon: FiBarChart2, component: DashboardAnalytics },
  { id: 'quotes', label: 'Quotes', icon: FiFeather, component: DashboardQuotes },
];

const PageSkeletonLoader = () => (
  <div className="flex justify-center items-center h-screen text-white/70">
    <div className="animate-pulse">Loading Dashboard...</div>
  </div>
);

const ConsolidatedDashboardPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isLoading } = useAuth();
  const appState = useGoalStore(state => state.appState);
  const saveDailyProgressAction = useGoalStore(state => state.saveDailyProgress);
  const showToast = useNotificationStore(state => state.showToast);

  const [isDailyProgressModalOpen, setIsDailyProgressModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isTabContentLoading, setIsTabContentLoading] = useState(false);

  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabItems.find(item => item.id === tabFromUrl)?.id || tabItems[0].id;
  });

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
      const { currentUser } = useGoalStore.getState();
      if (!currentUser) {
        showToast('Authentication required to save progress.', 'error');
        return;
      }
      try {
        await saveDailyProgressAction({
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
    [saveDailyProgressAction, showToast]
  );

  const initialProgress = useMemo(() => {
    return selectedDate && activeGoal
      ? activeGoal.dailyProgress[format(selectedDate, 'yyyy-MM-dd')] || null
      : null;
  }, [selectedDate, activeGoal]);

  const renderActiveTabContent = () => {
    if (isLoading || isTabContentLoading) {
      // REFACTOR: Use the common skeleton component.
      return <PageContentSkeleton />;
    }

    const ActiveComponent = tabItems.find(item => item.id === activeTab)?.component;

    if (ActiveComponent) {
      const commonProps: DashboardTabProps = {
        isDailyProgressModalOpen,
        selectedDate,
        handleDayClick,
        handleSaveProgress,
        setIsDailyProgressModalOpen,
      };

      const componentProps = {
        ...commonProps,
        ...(ActiveComponent.name === 'DashboardMain' && { appState }),
        ...(ActiveComponent.name === 'DashboardAnalytics' && { appState }),
        ...(ActiveComponent.name === 'DashboardQuotes' && {
          currentUser: useGoalStore.getState().currentUser,
          appState,
          onAppStateUpdate: (newAppState: AppState) =>
            useGoalStore.setState({ appState: newAppState }),
        }),
      };

      return <ActiveComponent {...componentProps} />;
    }
    return <DashboardMain {...({} as DashboardTabProps)} />;
  };

  return (
    <div className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex space-x-2">
          {isLoading
            ? [...Array(tabItems.length)].map((_, i) => (
                // FIX: Changed padding from py-4 to py-3 to match the real tabs
                <div key={i} className="px-4 py-3 animate-pulse">
                  <div className="w-24 h-6 rounded-md bg-white/10"></div>
                </div>
              ))
            : tabItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none
                    ${isActive ? 'text-white border-blue-500' : 'border-transparent text-white/60 hover:text-white'}`}
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
    <Suspense fallback={<PageSkeletonLoader />}>
      <ConsolidatedDashboardPageContent />
    </Suspense>
  );
}
