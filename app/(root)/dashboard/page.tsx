// app/(root)/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { User } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { IconType } from 'react-icons';
import { FiGrid, FiBarChart2, FiFeather, FiEdit } from 'react-icons/fi';
import { MdRocketLaunch } from 'react-icons/md';
import Link from 'next/link';
import { format, isToday } from 'date-fns';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp for goal handling

import { firebaseService } from '@/services/firebaseService';
import {
  AppState,
  Goal,
  DailyProgress,
  GoalStatus,
  SatisfactionLevel,
  RoutineType,
  RoutineLogStatus,
} from '@/types';
import ToastMessage from '@/components/common/ToastMessage';
import ConfirmationModal from '@/components/common/ConfirmationModal';

// Import the refactored dashboard components
import DashboardMain from '@/components/dashboard/DashboardMain';
import DashboardAnalytics from '@/components/dashboard/DashboardAnalytics';
import DashboardQuotes from '@/components/dashboard/DashboardQuotes';
import DashboardSettings from '@/components/dashboard/DashboardSettings';
import GoalModal from '@/components/dashboard/GoalModal';
import DailyProgressModal from '@/components/dashboard/DailyProgressModal';

// Define a specific interface for the props passed to each dashboard tab component
interface DashboardTabProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;

  // Props specific to DashboardMain (passed to DashboardMain component)
  isDailyProgressModalOpen: boolean;
  selectedDate: Date | null;
  handleDayClick: (date: Date) => void;
  handleSaveProgress: (progressData: Partial<DailyProgress>) => Promise<void>;
  setIsDailyProgressModalOpen: (isOpen: boolean) => void;

  // Props specific to DashboardSettings (passed to DashboardSettings component)
  handleOpenGoalModal: (isEditing?: boolean) => void;
  promptForArchiveAndNewGoal: () => void;
  handleExport: () => Promise<void>;
  handleImportChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  transformedGoalForModal: {
    name: string;
    description: string | null;
    startDate: string;
    endDate: string;
  } | null;
  isEditMode: boolean; // Indicates if GoalModal should open in edit mode
}

interface TabItem {
  id: string;
  label: string;
  icon: IconType;
  component: React.ComponentType<DashboardTabProps>; // Component now receives DashboardTabProps
}

const tabItems: TabItem[] = [
  { id: 'main', label: 'Dashboard', icon: FiGrid, component: DashboardMain },
  { id: 'analytics', label: 'Analytics', icon: FiBarChart2, component: DashboardAnalytics },
  { id: 'quotes', label: 'Quotes', icon: FiFeather, component: DashboardQuotes },
  { id: 'settings', label: 'Settings', icon: FiEdit, component: DashboardSettings },
];

// Skeleton Loader for dashboard page to show during data fetching
const PageSkeletonLoader = () => (
  <div className="space-y-8 animate-pulse">
    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl shadow-lg">
      <div className="mb-2 w-1/3 h-8 rounded-lg bg-white/10"></div>
      <div className="mb-6 w-full h-4 rounded-lg bg-white/10"></div>
      <div className="space-y-3">
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

  // States for GoalModal and ConfirmationModal (managed at the page level)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // True if editing an existing goal, false for new goal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // For confirmation dialogs
  const [confirmationProps, setConfirmationProps] = useState<{
    title: string;
    message: string;
    action: () => Promise<void> | void; // Action can be async or sync
    actionDelayMs: number;
  }>({
    // Explicit type for confirmationProps
    title: '',
    message: '',
    action: () => {},
    actionDelayMs: 0,
  });

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

  // --- DashboardSettings Specific Handlers (moved to page level) ---

  const handleSetGoal = useCallback(
    async (goalName: string, endDate: Date, description: string) => {
      if (!currentUser || !appState) {
        showMessage('Authentication required to set goal.', 'error');
        return;
      }

      if (isEditMode && activeGoal) {
        const updatedGoal: Goal = {
          ...activeGoal,
          name: goalName,
          description: description,
          endDate: Timestamp.fromDate(endDate),
          updatedAt: Timestamp.now(),
        };
        try {
          await firebaseService.updateGoal(currentUser.uid, activeGoal.id, updatedGoal);
          const updatedGoals = {
            ...appState.goals,
            [activeGoal.id]: updatedGoal,
          };
          handleAppStateUpdate({ ...appState, goals: updatedGoals });
          setIsGoalModalOpen(false);
          showMessage('Goal updated successfully!', 'success');
        } catch (error) {
          console.error('Failed to update goal:', error);
          showMessage('Failed to update goal.', 'error');
        }
      } else {
        const newGoalData: Omit<
          Goal,
          | 'id'
          | 'createdAt'
          | 'updatedAt'
          | 'dailyProgress'
          | 'toDoList'
          | 'notToDoList'
          | 'stickyNotes'
          | 'routineSettings'
          | 'starredQuotes'
        > = {
          name: goalName,
          description: description,
          startDate: Timestamp.now(),
          endDate: Timestamp.fromDate(endDate),
          status: GoalStatus.ACTIVE,
        };
        try {
          const createdGoal = await firebaseService.createGoal(currentUser.uid, newGoalData);
          const updatedGoals = { ...appState.goals, [createdGoal.id]: createdGoal };
          handleAppStateUpdate({ ...appState, goals: updatedGoals, activeGoalId: createdGoal.id });
          setIsGoalModalOpen(false);
          showMessage('Goal set successfully!', 'success');
        } catch (error) {
          console.error('Failed to create goal:', error);
          showMessage('Failed to set goal.', 'error');
        }
      }
    },
    [currentUser, appState, activeGoal, isEditMode, showMessage, handleAppStateUpdate]
  );

  const handleOpenGoalModal = useCallback((isEditing = false) => {
    setIsEditMode(isEditing);
    setIsGoalModalOpen(true);
  }, []);

  const promptForArchiveAndNewGoal = useCallback(() => {
    if (activeGoal) {
      setConfirmationProps({
        title: 'Archive Current Goal?',
        message:
          'This will mark your current goal as completed and clear it as the active goal. All its data will remain accessible through the archive page. The confirm button will be enabled in 3 seconds.',
        action: async () => {
          if (!currentUser) return;
          try {
            // Call the modified firebaseService.archiveCurrentGoal
            const newAppState = await firebaseService.archiveCurrentGoal(currentUser.uid); // FIX: Using correct firebaseService method
            handleAppStateUpdate(newAppState);
            showMessage('Goal archived! Ready for the next one.', 'success');
            handleOpenGoalModal(false);
          } catch (e) {
            console.error('Error archiving goal:', e);
            showMessage((e as Error).message || 'Failed to archive goal.', 'error');
          }
        },
        actionDelayMs: 3000,
      });
      setIsConfirmModalOpen(true);
    } else {
      handleOpenGoalModal(false);
    }
  }, [activeGoal, currentUser, showMessage, handleAppStateUpdate, handleOpenGoalModal]); // FIX: Added handleAppStateUpdate to dependencies

  const handleImportChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !currentUser) return;
      if (file.size > 5 * 1024 * 1024) {
        showMessage('File is too large (max 5MB).', 'error');
        return;
      }
      event.target.value = '';

      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const importedRawData = JSON.parse(e.target?.result as string);
          const importedState = firebaseService.deserializeAppState(importedRawData);

          const confirmImport = () => handleConfirmImport(importedState);

          if (appState?.activeGoalId && appState.goals[appState.activeGoalId]) {
            setConfirmationProps({
              title: 'Overwrite All Data?',
              message:
                'Importing will replace all your current data. This action is irreversible. The confirm button will be enabled in 10 seconds.',
              action: confirmImport,
              actionDelayMs: 10000,
            });
            setIsConfirmModalOpen(true);
          } else {
            confirmImport();
          }
        } catch (error) {
          console.error('Import failed:', error);
          showMessage('Import failed: Invalid file format.', 'error');
        }
      };
      reader.readAsText(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser, appState, showMessage]
  );

  const handleConfirmImport = useCallback(
    async (importedState: AppState) => {
      if (!currentUser) return;
      try {
        await firebaseService.setUserData(currentUser.uid, importedState);
        showMessage('Data imported successfully. Refreshing...', 'success');
        setIsConfirmModalOpen(false);
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        console.error('Failed to save imported data:', error);
        showMessage(`Failed to save imported data: ${(error as Error).message}`, 'error');
        setIsConfirmModalOpen(false);
      }
    },
    [currentUser, showMessage]
  );

  const handleExport = useCallback(async () => {
    if (!currentUser || !appState) {
      showMessage('No data to export.', 'info');
      return;
    }
    try {
      const serializableData = firebaseService.serializeAppState(appState);
      const dataStr = JSON.stringify(serializableData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `one-goal-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showMessage('Data exported successfully.', 'success');
    } catch (error) {
      console.error('Failed to export data:', error);
      showMessage(`Failed to export data: ${(error as Error).message}`, 'error');
    }
  }, [currentUser, appState, showMessage]);

  const transformedGoalForModal = useMemo(() => {
    return activeGoal
      ? {
          name: activeGoal.name,
          description: activeGoal.description,
          startDate: activeGoal.startDate.toDate().toISOString(),
          endDate: activeGoal.endDate.toDate().toISOString(),
        }
      : null;
  }, [activeGoal]);

  // Main rendering logic for the active tab
  const renderActiveTabContent = () => {
    // If no user data is loaded yet, show a page-level skeleton
    if (isLoading) {
      return <PageSkeletonLoader />;
    }

    // If there's no active goal selected, prompt the user to set one (and show settings actions)
    if (!activeGoal) {
      return (
        <div className="space-y-12">
          <section>
            <div className="p-10 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
              <MdRocketLaunch className="mx-auto mb-6 w-20 h-20 text-white/70" />
              <h2 className="mb-4 text-3xl font-bold text-white">Start Your Journey</h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
                Define your primary objective or import existing data using the management options
                below.
              </p>
              <Link
                href="/dashboard?tab=settings" // Link to settings tab
                className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105"
              >
                <FiEdit size={20} /> {/* Use FiEdit for settings link */}
                Go to Settings to Set Goal
              </Link>
            </div>
          </section>
          {/* Render DashboardSettings directly when no goal is set */}
          <DashboardSettings
            currentUser={currentUser}
            appState={appState}
            showMessage={showMessage}
            onAppStateUpdate={handleAppStateUpdate}
            handleOpenGoalModal={handleOpenGoalModal}
            promptForArchiveAndNewGoal={promptForArchiveAndNewGoal}
            handleExport={handleExport}
            handleImportChange={handleImportChange}
            transformedGoalForModal={transformedGoalForModal}
            isEditMode={isEditMode}
          />
        </div>
      );
    }

    // Render content based on the active tab when a goal exists
    const dashboardTabProps: DashboardTabProps = {
      // Define props object once
      currentUser,
      appState,
      showMessage,
      onAppStateUpdate: handleAppStateUpdate,
      // DashboardMain specific
      isDailyProgressModalOpen,
      selectedDate,
      handleDayClick,
      handleSaveProgress,
      setIsDailyProgressModalOpen,
      // DashboardSettings specific (also passed to DashboardMain for its "no goal" section)
      handleOpenGoalModal,
      promptForArchiveAndNewGoal,
      handleExport,
      handleImportChange,
      transformedGoalForModal,
      isEditMode,
    };

    const ActiveComponent = tabItems.find(item => item.id === activeTab)?.component;

    if (ActiveComponent) {
      return <ActiveComponent {...dashboardTabProps} />;
    }
    return null; // Fallback if no component found
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

      {/* Modals (shared across tabs where applicable) */}
      {/* Daily Progress Modal */}
      {isDailyProgressModalOpen &&
        selectedDate && ( // Render only if open and selectedDate exists
          <DailyProgressModal
            isOpen={isDailyProgressModalOpen}
            onClose={() => setIsDailyProgressModalOpen(false)}
            date={selectedDate}
            initialProgress={
              selectedDate && activeGoal
                ? activeGoal.dailyProgress[format(selectedDate, 'yyyy-MM-dd')] || null
                : null
            }
            onSave={handleSaveProgress}
            showMessage={showMessage}
          />
        )}

      {/* Goal Modal (for setting/editing goals) */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSetGoal={handleSetGoal}
        showMessage={showMessage}
        initialGoalData={isEditMode ? transformedGoalForModal : null}
        isEditMode={isEditMode}
      />

      {/* Confirmation Modal (for archive/import) */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={confirmationProps.title}
        message={confirmationProps.message}
        confirmButton={{
          text: 'Confirm',
          onClick: () => {
            confirmationProps.action(); // Execute the action defined in confirmationProps
            setIsConfirmModalOpen(false); // Close modal
          },
          className: 'bg-red-600 text-white hover:bg-red-700',
        }}
        cancelButton={{ text: 'Cancel', onClick: () => setIsConfirmModalOpen(false) }}
        actionDelayMs={confirmationProps.actionDelayMs}
      />
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
