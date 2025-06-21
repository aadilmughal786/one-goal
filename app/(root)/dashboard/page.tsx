// app/(root)/dashboard/page.tsx
'use client';

import { format, isToday } from 'date-fns'; // Import format and isToday
import { User } from 'firebase/auth';
import Link from 'next/link'; // For linking to other pages
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { IconType } from 'react-icons';
import { FiBarChart2, FiEdit, FiFeather, FiGrid } from 'react-icons/fi'; // FiEdit for the "Go to Goals Page" link
import { MdRocketLaunch } from 'react-icons/md'; // For no-goal message
// Removed Timestamp import as GoalModal/ConfirmationModal are no longer here
// import { Timestamp } from 'firebase/firestore';

import ToastMessage from '@/components/common/ToastMessage';
import { firebaseService } from '@/services/firebaseService';
import { AppState, DailyProgress, RoutineLogStatus, RoutineType, SatisfactionLevel } from '@/types';
// Removed ConfirmationModal and GoalModal imports as they are no longer managed here
// import ConfirmationModal from '@/components/common/ConfirmationModal';
// import GoalModal from '@/components/dashboard/GoalModal';

// Import the refactored dashboard components
import DailyProgressModal from '@/components/dashboard/DailyProgressModal';
import DashboardAnalytics from '@/components/dashboard/DashboardAnalytics';
import DashboardMain from '@/components/dashboard/DashboardMain';
import DashboardQuotes from '@/components/dashboard/DashboardQuotes';
// Removed DashboardSettings import as it's no longer part of DashboardPage directly
// import DashboardSettings from '@/components/dashboard/DashboardSettings';

// Define a simplified interface for the props passed to each dashboard tab component
interface DashboardTabProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;

  // Props specific to DashboardMain's daily progress logging
  isDailyProgressModalOpen: boolean;
  selectedDate: Date | null;
  handleDayClick: (date: Date) => void;
  handleSaveProgress: (progressData: Partial<DailyProgress>) => Promise<void>;
  setIsDailyProgressModalOpen: (isOpen: boolean) => void;

  // Goal management props are now REMOVED from this interface
  // handleOpenGoalModal: (isEditing?: boolean) => void;
  // promptForArchiveAndNewGoal: () => void;
  // handleExport: () => Promise<void>;
  // handleImportChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // transformedGoalForModal: { name: string; description: string | null; startDate: string; endDate: string } | null;
  // isEditMode: boolean;
}

interface TabItem {
  id: string;
  label: string;
  icon: IconType;
  component: React.ComponentType<DashboardTabProps>; // Component now receives simplified DashboardTabProps
}

// Updated tab items: Removed 'settings' tab
const tabItems: TabItem[] = [
  { id: 'main', label: 'Dashboard', icon: FiGrid, component: DashboardMain },
  { id: 'analytics', label: 'Analytics', icon: FiBarChart2, component: DashboardAnalytics },
  { id: 'quotes', label: 'Quotes', icon: FiFeather, component: DashboardQuotes },
];

// Skeleton Loader for dashboard page to show during data fetching
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

// Main content component for the Dashboard Page
const ConsolidatedDashboardPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States for DailyProgressModal (moved to page level)
  const [isDailyProgressModalOpen, setIsDailyProgressModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Removed states for GoalModal and ConfirmationModal as they are no longer managed here
  // const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  // const [isEditMode, setIsEditMode] = useState(false);
  // const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  // const [confirmationProps, setConfirmationProps] = useState({ /* ... */ });

  // Common Toast states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Active tab state, initialized from URL search parameters or defaults to 'main'
  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabItems.find(item => item.id === tabFromUrl)?.id || tabItems[0].id;
  });

  // Callback to display toast messages
  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000); // Hide after 5 seconds
  }, []);

  // Callback to update the global appState, passed down to child components.
  const handleAppStateUpdate = useCallback((newAppState: AppState) => {
    setAppState(newAppState);
  }, []);

  // --- Common Data Fetching ---
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
        router.replace('/login'); // Redirect unauthenticated users
      }
    });
    return () => unsubscribe(); // Cleanup Firebase auth listener
  }, [router, showMessage]);

  // --- Tab Navigation Logic ---
  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTabInternal(tabId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false }); // Update URL without full reload
    },
    [router, searchParams]
  );

  // Sync active tab state with URL search params on mount/update
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && activeTab !== tabFromUrl) {
      if (tabItems.some(item => item.id === tabFromUrl)) {
        setActiveTabInternal(tabFromUrl);
      }
    }
  }, [searchParams, activeTab]);

  // --- DashboardMain Specific Handlers (moved to page level) ---
  const activeGoal = useMemo(() => {
    if (!appState?.activeGoalId || !appState.goals) return null;
    return appState.goals[appState.activeGoalId];
  }, [appState]);

  const handleDayClick = useCallback(
    (date: Date) => {
      if (isToday(date)) {
        setSelectedDate(date);
        setIsDailyProgressModalOpen(true);
      } else {
        showMessage(
          "You can only log today's progress directly. Click on past days to view details in charts.",
          'info'
        );
      }
    },
    [showMessage]
  );

  const handleSaveProgress = useCallback(
    async (progressData: Partial<DailyProgress>) => {
      if (!currentUser || !appState || !activeGoal) {
        showMessage('Authentication or active goal required to save progress.', 'error');
        return;
      }

      const dateKey = progressData.date || format(new Date(), 'yyyy-MM-dd');
      const existingProgress = appState.goals[activeGoal.id].dailyProgress[dateKey];

      const completeProgressData: DailyProgress = {
        date: dateKey,
        satisfaction: progressData.satisfaction ?? SatisfactionLevel.NEUTRAL,
        notes: progressData.notes ?? '',
        sessions: existingProgress?.sessions ?? [],
        routines: existingProgress?.routines ?? ({} as Record<RoutineType, RoutineLogStatus>),
      };

      try {
        await firebaseService.saveDailyProgress(
          activeGoal.id,
          currentUser.uid,
          completeProgressData
        );

        const updatedDailyProgress = {
          ...appState.goals[activeGoal.id].dailyProgress,
          [completeProgressData.date]: completeProgressData,
        };

        const updatedGoal = {
          ...activeGoal,
          dailyProgress: updatedDailyProgress,
        };

        const newAppState = {
          ...appState,
          goals: {
            ...appState.goals,
            [activeGoal.id]: updatedGoal,
          },
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

  // Memoized initialProgress for DailyProgressModal
  const initialProgress = useMemo(() => {
    return selectedDate && activeGoal
      ? activeGoal.dailyProgress[format(selectedDate, 'yyyy-MM-dd')] || null
      : null;
  }, [selectedDate, activeGoal]);

  // Main rendering logic for the active tab
  const renderActiveTabContent = () => {
    // If no user data is loaded yet, show a page-level skeleton
    if (isLoading) {
      return <PageSkeletonLoader />;
    }

    // If there's no active goal selected, prompt the user to set one (and link to goals page)
    if (!activeGoal) {
      return (
        <div className="flex flex-col justify-center items-center p-10 h-full text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
          <MdRocketLaunch className="mx-auto mb-6 w-20 h-20 text-white/70" />
          <h2 className="mb-4 text-3xl font-bold text-white">No Active Goal Found</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
            Please set a primary goal to begin tracking your progress. Goal management is now
            handled on the dedicated Goals page.
          </p>
          <Link
            href="/goal" // Link to the new /goal page
            className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105"
          >
            <FiEdit size={20} /> {/* Using FiEdit for goal management link */}
            Go to Goals Page
          </Link>
        </div>
      );
    }

    // Props object for components rendered in tabs.
    // This ensures all components receive the necessary shared data and handlers.
    const dashboardTabProps: DashboardTabProps = {
      currentUser,
      appState,
      showMessage,
      onAppStateUpdate: handleAppStateUpdate,
      // DashboardMain specific props
      isDailyProgressModalOpen,
      selectedDate,
      handleDayClick,
      handleSaveProgress,
      setIsDailyProgressModalOpen,
      // Goal management related props are removed from here as they are no longer needed
      // (e.g., handleOpenGoalModal, promptForArchiveAndNewGoal, handleExport, handleImportChange, transformedGoalForModal, isEditMode)
    };

    const ActiveComponent = tabItems.find(item => item.id === activeTab)?.component;

    if (ActiveComponent) {
      return <ActiveComponent {...dashboardTabProps} />;
    }
    return null; // Fallback if no component found for the active tab
  };

  return (
    <div className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <ToastMessage message={toastMessage} type={toastType} />

      {/* Horizontal Tab Navigation */}
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

      {/* Main Content Area */}
      <main className="flex-grow p-4 mx-auto w-full max-w-4xl md:p-8">
        {renderActiveTabContent()}
      </main>

      {/* Daily Progress Modal (only rendered if open and selectedDate exists) */}
      {isDailyProgressModalOpen && selectedDate && (
        <DailyProgressModal
          isOpen={isDailyProgressModalOpen}
          onClose={() => setIsDailyProgressModalOpen(false)}
          date={selectedDate}
          initialProgress={initialProgress} // Use initialProgress from memoized value
          onSave={handleSaveProgress}
          showMessage={showMessage}
        />
      )}

      {/* GoalModal and ConfirmationModal are no longer rendered directly by the dashboard page,
          as their logic has been moved to the /goal page for centralized goal management.
          The DashboardSettings component (if still present) will now link to the /goal page for these actions.
      */}
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
