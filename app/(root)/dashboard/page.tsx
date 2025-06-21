// app/(root)/dashboard/page.tsx
'use client';

import { format } from 'date-fns';
import { User } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { IconType } from 'react-icons';
import { FiBarChart2, FiFeather, FiGrid } from 'react-icons/fi';

import ToastMessage from '@/components/common/ToastMessage';
import { firebaseService } from '@/services/firebaseService';
import { AppState, DailyProgress, RoutineLogStatus, RoutineType, SatisfactionLevel } from '@/types';

import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import DailyProgressModal from '@/components/dashboard/DailyProgressModal';
import DashboardAnalytics from '@/components/dashboard/DashboardAnalytics';
import DashboardMain from '@/components/dashboard/DashboardMain';
import DashboardQuotes from '@/components/dashboard/DashboardQuotes';

interface DashboardTabProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
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
  <div className="space-y-8 animate-pulse">
    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl shadow-lg">
      <div className="mb-2 w-1/3 h-8 rounded-lg bg-white/10"></div>
      <div className="mb-6 w-full h-4 rounded-lg bg-white/10"></div>
      <div className="space-y-3">
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
      </div>
    </div>
  </div>
);

const ConsolidatedDashboardPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDailyProgressModalOpen, setIsDailyProgressModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabItems.find(item => item.id === tabFromUrl)?.id || tabItems[0].id;
  });

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  }, []);

  const handleAppStateUpdate = useCallback((newAppState: AppState) => {
    setAppState(newAppState);
  }, []);

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      if (user) {
        setCurrentUser(user);
        firebaseService
          .getUserData(user.uid)
          .then(data => {
            setAppState(data);
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Error fetching user data:', error);
            showMessage('Failed to load user data.', 'error');
            setIsLoading(false);
          });
      } else {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router, showMessage]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTabInternal(tabId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && activeTab !== tabFromUrl) {
      if (tabItems.some(item => item.id === tabFromUrl)) {
        setActiveTabInternal(tabFromUrl);
      }
    }
  }, [searchParams, activeTab]);

  const activeGoal = useMemo(() => {
    if (!appState?.activeGoalId || !appState.goals) return null;
    return appState.goals[appState.activeGoalId];
  }, [appState]);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setIsDailyProgressModalOpen(true);
  }, []);

  // **THE FIX IS HERE**: The logic for constructing `completeProgressData` is now corrected.
  // It correctly uses the `routines` object passed from the modal, ensuring your selections are saved.
  const handleSaveProgress = useCallback(
    async (progressData: Partial<DailyProgress>) => {
      if (!currentUser || !appState || !activeGoal) {
        showMessage('Authentication or active goal required to save progress.', 'error');
        return;
      }

      const dateKey = progressData.date || format(new Date(), 'yyyy-MM-dd');
      const existingProgress = appState.goals[activeGoal.id].dailyProgress[dateKey];

      // The new `completeProgressData` now correctly merges the incoming routines
      // from the modal with any existing data for that day.
      const completeProgressData: DailyProgress = {
        date: dateKey,
        satisfaction: progressData.satisfaction ?? SatisfactionLevel.NEUTRAL,
        notes: progressData.notes ?? '',
        sessions: existingProgress?.sessions ?? [],
        routines:
          progressData.routines ??
          existingProgress?.routines ??
          ({} as Record<RoutineType, RoutineLogStatus>),
      };

      try {
        await firebaseService.saveDailyProgress(
          activeGoal.id,
          currentUser.uid,
          completeProgressData
        );

        // Optimistically update local state to avoid a full re-fetch
        const updatedDailyProgress = {
          ...appState.goals[activeGoal.id].dailyProgress,
          [completeProgressData.date]: completeProgressData,
        };
        const updatedGoal = { ...activeGoal, dailyProgress: updatedDailyProgress };
        const newAppState = {
          ...appState,
          goals: { ...appState.goals, [activeGoal.id]: updatedGoal },
        };
        handleAppStateUpdate(newAppState);

        setIsDailyProgressModalOpen(false);
        showMessage('Progress saved successfully!', 'success');
      } catch (error) {
        console.error('Failed to save daily progress:', error);
        showMessage('Failed to save daily progress.', 'error');
      }
    },
    [currentUser, appState, activeGoal, showMessage, handleAppStateUpdate]
  );

  const initialProgress = useMemo(() => {
    return selectedDate && activeGoal
      ? activeGoal.dailyProgress[format(selectedDate, 'yyyy-MM-dd')] || null
      : null;
  }, [selectedDate, activeGoal]);

  const renderActiveTabContent = () => {
    if (isLoading) {
      return <PageSkeletonLoader />;
    }

    if (!activeGoal) {
      return <NoActiveGoalMessage />;
    }

    const dashboardTabProps: DashboardTabProps = {
      currentUser,
      appState,
      showMessage,
      onAppStateUpdate: handleAppStateUpdate,
      isDailyProgressModalOpen,
      selectedDate,
      handleDayClick,
      handleSaveProgress,
      setIsDailyProgressModalOpen,
    };

    const ActiveComponent = tabItems.find(item => item.id === activeTab)?.component;

    if (ActiveComponent) {
      return <ActiveComponent {...dashboardTabProps} />;
    }
    return null;
  };

  return (
    <div className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <ToastMessage message={toastMessage} type={toastType} />
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex space-x-2">
          {isLoading
            ? [...Array(tabItems.length)].map((_, i) => (
                <div key={i} className="px-4 py-4 animate-pulse">
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
        {renderActiveTabContent()}
      </main>
      {isDailyProgressModalOpen && selectedDate && (
        <DailyProgressModal
          isOpen={isDailyProgressModalOpen}
          onClose={() => setIsDailyProgressModalOpen(false)}
          date={selectedDate}
          initialProgress={initialProgress}
          onSave={handleSaveProgress}
          showMessage={showMessage}
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
