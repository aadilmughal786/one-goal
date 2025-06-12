// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react'; // Keep useRef for interval cleanup if needed, but not for countdown itself now
import { User } from 'firebase/auth';
import { useSearchParams, useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

// Import types
import { AppState, ListItem, UrgencyLevel, Goal, TodoItem, AppMode } from '@/types';

// Import Firebase service functions (using the instance)
import { firebaseService } from '@/services/firebaseService';

// Import Local Storage service functions (using the instance)
import { localStorageService } from '@/services/localStorageService';

// Component imports
import NavBar from '@/components/NavBar';
import GoalModal from '@/components/GoalModal';
import ToastMessage from '@/components/ToastMessage';
import Footer from '@/components/Footer';
import DeveloperModal from '@/components/DeveloperModal';
import ConfirmationModal from '@/components/ConfirmationModal';

// Icon imports
import { MdRocketLaunch } from 'react-icons/md';
import { FiTarget, FiAward, FiClock, FiUpload } from 'react-icons/fi'; // Re-added FiAward, FiClock for countdown display, added FiUpload

// Initial state for the persistent data (conforms to AppState type)
const initialPersistentAppState: AppState = {
  goal: null,
  notToDoList: [],
  contextItems: [],
  toDoList: [],
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Tracks if Firebase auth check is complete
  const [dataLoading, setDataLoading] = useState(true); // Tracks if data (from any source) is being loaded

  // Initialize appMode directly from local storage
  const [appMode, setAppMode] = useState<AppMode>(localStorageService.getAppModeFromLocalStorage());

  // Main application state for persistent data
  const [appState, setAppState] = useState<AppState>(initialPersistentAppState);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalModalEditMode, setGoalModalEditMode] = useState(false);
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState(false);

  // Updated toast message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // --- Confirmation Modal State and Callbacks ---
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmationAction, setConfirmationAction] = useState<(() => void) | null>(null); // For generic 2-button confirmations

  const openConfirmationModal = useCallback(
    (title: string, message: string, action: () => void) => {
      setConfirmationTitle(title);
      setConfirmationMessage(message);
      setConfirmationAction(() => action);
      setIsConfirmationModalOpen(true);
    },
    []
  );

  const closeConfirmationModal = useCallback(() => {
    setIsConfirmationModalOpen(false);
    setConfirmationAction(null);
  }, []);

  const handleConfirmation = useCallback(() => {
    if (confirmationAction) {
      confirmationAction();
    }
    closeConfirmationModal();
  }, [confirmationAction, closeConfirmationModal]);
  // --- End Confirmation Modal State and Callbacks ---

  // --- UI Message Handler ---
  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    // Auto-clear message after toast duration (5 seconds + buffer)
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  }, []);

  // --- Initial App Mode and Data Loading Logic ---
  useEffect(() => {
    const loadInitialData = async () => {
      setDataLoading(true);
      setAuthLoading(true);

      const currentAppMode = appMode;

      if (currentAppMode === 'guest') {
        try {
          const loadedGuestData = localStorageService.loadLocalState();
          if (loadedGuestData) {
            setAppState(loadedGuestData);
            showMessage('Guest data loaded from local storage.', 'info');
          } else {
            // AppMode was 'guest' but no data found (e.g., cleared manually outside app flow)
            setAppState(initialPersistentAppState);
            showMessage(
              'Local storage data not found or corrupted. Starting fresh guest session.',
              'info'
            );
            localStorageService.clearLocalState(); // Clear any corrupted local data
            return;
          }
        } catch (error: any) {
          // Error loading from local storage (e.g., parsing error from localStorageService)
          showMessage(
            `Error loading guest data: ${error.message || 'Unknown error'}. Starting fresh.`,
            'error'
          );
          setAppState(initialPersistentAppState);
          localStorageService.clearLocalState();
          return;
        } finally {
          setDataLoading(false);
          setAuthLoading(false); // Auth not directly needed for guest path
        }
      } else if (currentAppMode === 'google') {
        // Proceed with Firebase auth check
        const unsubscribeAuth = firebaseService.onAuthChange(async user => {
          setAuthLoading(false); // Firebase auth check complete

          if (user) {
            setCurrentUser(user);
            try {
              const loadedFirebaseData = await firebaseService.loadUserData(user.uid);
              setAppState(loadedFirebaseData);
              showMessage('Firebase data loaded.', 'success');
            } catch (firebaseLoadError: any) {
              showMessage(
                `Failed to load Firebase data: ${firebaseLoadError.message || 'Unknown error'}`,
                'error'
              );
              setAppState(initialPersistentAppState);
            }
          } else {
            // AppMode was 'google' but no active Firebase user, session expired or logged out
            setCurrentUser(null);
            setAppMode('none'); // Fallback to none mode
            localStorageService.clearAppModeFromLocalStorage(); // Clear stale 'google' mode
            router.replace('/login'); // Redirect
          }
          setDataLoading(false); // Data loading complete for Firebase path
        });
        return () => unsubscribeAuth(); // Cleanup Firebase listener
      } else {
        // currentAppMode === 'none' (or initially not set)
        // Fallback to Firebase auth check (or redirect if no user)
        const unsubscribeAuth = firebaseService.onAuthChange(async user => {
          setAuthLoading(false); // Firebase auth check complete

          if (user) {
            setCurrentUser(user);
            setAppMode('google'); // Set mode based on active user
            localStorageService.setAppModeInLocalStorage('google'); // Persist mode
            try {
              const loadedFirebaseData = await firebaseService.loadUserData(user.uid);
              setAppState(loadedFirebaseData);
              showMessage('Firebase data loaded.', 'success');
            } catch (firebaseLoadError: any) {
              showMessage(
                `Failed to load Firebase data: ${firebaseLoadError.message || 'Unknown error'}`,
                'error'
              );
              setAppState(initialPersistentAppState);
            }
          } else {
            setCurrentUser(null);
            setAppMode('none');
            localStorageService.clearAppModeFromLocalStorage();
            router.replace('/login');
          }
          setDataLoading(false);
        });
        return () => unsubscribeAuth();
      }
    };

    loadInitialData();
  }, [router, showMessage, appMode]);

  // --- Data Persistence Logic (Firebase vs Local Storage) ---
  useEffect(() => {
    // Only save if initial loading is complete AND appMode is established (not 'none')
    if (!authLoading && !dataLoading && appMode !== 'none') {
      const dataToSave: AppState = appState;

      if (appMode === 'google' && currentUser) {
        firebaseService.saveUserData(currentUser.uid, dataToSave).catch(error => {
          showMessage(
            `Failed to save data to Firebase: ${error.message || 'Unknown error'}`,
            'error'
          );
        });
      } else if (appMode === 'guest') {
        localStorageService.saveLocalState(dataToSave);
      }
    }
  }, [
    appState.goal,
    appState.notToDoList,
    appState.contextItems,
    appState.toDoList,
    currentUser,
    appMode,
    authLoading,
    dataLoading,
    showMessage,
  ]);

  // --- Authentication Handlers ---
  const handleSignOut = useCallback(async () => {
    openConfirmationModal(
      'Sign Out',
      'Are you sure you want to sign out? Your current session will end.',
      async () => {
        try {
          if (appMode === 'google') {
            await firebaseService.signOutUser();
            showMessage('Signed out successfully!', 'success');
          } else if (appMode === 'guest') {
            showMessage('Guest session ended. Your data is saved locally.', 'success');
          }
          localStorageService.clearAppModeFromLocalStorage();
          setAppMode('none');
          router.replace('/');
        } catch (error: any) {
          showMessage(`Sign-out error: ${error.message || 'Unknown error'}`, 'error');
        }
      }
    );
  }, [showMessage, openConfirmationModal, router, appMode]);

  const handleSignInWithGoogleFromGuest = useCallback(() => {
    router.push('/login');
  }, [router]);

  // --- Modal Functions ---
  const openGoalModal = useCallback(() => {
    setGoalModalEditMode(false);
    setIsGoalModalOpen(true);
  }, []);
  const closeGoalModal = useCallback(() => setIsGoalModalOpen(false), []);
  const openDeveloperModal = useCallback(() => setIsDeveloperModalOpen(true), []);
  const closeDeveloperModal = useCallback(() => setIsDeveloperModalOpen(false), []);

  const handleEditGoal = useCallback(() => {
    if (appState.goal) {
      setGoalModalEditMode(true);
      setIsGoalModalOpen(true);
    } else {
      showMessage('No goal set to update. Please create a new goal first.', 'info');
    }
  }, [appState.goal, showMessage]);

  const handleNewGoal = useCallback(() => {
    if (
      appState.goal ||
      appState.notToDoList.length > 0 ||
      appState.contextItems.length > 0 ||
      appState.toDoList.length > 0
    ) {
      openConfirmationModal(
        'Create New Goal',
        'Creating a new goal will remove all your existing data. Are you sure you want to proceed?',
        () => {
          setAppState(initialPersistentAppState); // Reset app state to initial
          openGoalModal();
          showMessage('Starting a new goal. Your previous data has been cleared.', 'info');
        }
      );
    } else {
      openGoalModal();
    }
  }, [
    appState.goal,
    appState.notToDoList,
    appState.contextItems,
    appState.toDoList,
    openConfirmationModal,
    openGoalModal,
    showMessage,
  ]);

  // --- Goal Management Functions ---
  const setGoal = useCallback(
    (goalName: string, endDateStr: string, description?: string) => {
      const goalEndDate = new Date(endDateStr);

      if (!goalName.trim() || goalEndDate <= new Date()) {
        showMessage(
          'Invalid goal or date. Please ensure goal name is not empty and date is in the future.',
          'error'
        );
        return;
      }

      // Convert string dates to Timestamp for storage in appState (which aligns with Goal type)
      const startDateTimestamp =
        appState.goal?.startDate instanceof Timestamp
          ? appState.goal.startDate
          : Timestamp.fromDate(new Date());

      const endDateTimestamp = Timestamp.fromDate(goalEndDate);

      setAppState(prev => ({
        ...prev,
        goal: {
          name: goalName,
          description: description || '',
          startDate: startDateTimestamp,
          endDate: endDateTimestamp,
        },
      }));
      closeGoalModal();
      showMessage(
        goalModalEditMode ? 'Goal updated successfully!' : 'Goal set successfully!',
        'success'
      );
    },
    [closeGoalModal, showMessage, goalModalEditMode, appState.goal]
  );

  const resetGoal = useCallback(() => {
    openConfirmationModal(
      'Reset Goal',
      'Are you sure you want to reset your goal? This will delete all progress and cannot be undone.',
      () => {
        setAppState(initialPersistentAppState);
        showMessage('Goal reset!', 'info');
      }
    );
  }, [showMessage, openConfirmationModal]);

  // --- Export/Import Data ---
  const exportData = useCallback(() => {
    const dataToExport: AppState = appState;

    if (
      !dataToExport.goal &&
      dataToExport.notToDoList.length === 0 &&
      dataToExport.contextItems.length === 0 &&
      dataToExport.toDoList.length === 0
    ) {
      showMessage('No persistent data to export!', 'info');
      return;
    }

    try {
      // Convert Timestamp objects to ISO strings for export to JSON
      const serializableData = {
        ...dataToExport,
        goal: dataToExport.goal
          ? {
              ...dataToExport.goal,
              startDate: dataToExport.goal.startDate.toDate().toISOString(),
              endDate: dataToExport.goal.endDate.toDate().toISOString(),
            }
          : null,
      };

      const dataStr = JSON.stringify(serializableData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `one-goal-backup-${appMode === 'google' ? 'firebase' : 'guest'}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showMessage('Data exported successfully!', 'success');
    } catch (error: any) {
      showMessage(`Failed to export data: ${error.message || 'Unknown error'}`, 'error');
    }
  }, [appState, appMode, showMessage]);

  const importData = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const importedRawData = JSON.parse(e.target?.result as string);
          if (
            typeof importedRawData !== 'object' ||
            importedRawData === null ||
            !(
              'goal' in importedRawData ||
              'notToDoList' in importedRawData ||
              'contextItems' in importedRawData ||
              'toDoList' in importedRawData
            )
          ) {
            showMessage(
              "Invalid backup file format. Please ensure it's a 'One Goal' backup.",
              'error'
            );
            return;
          }

          openConfirmationModal(
            'Import Data',
            'This will replace all your current data. Are you sure you want to proceed?',
            () => {
              // Convert ISO strings back to Timestamp objects for the imported goal
              const importedGoalWithTimestamps = importedRawData.goal
                ? {
                    ...importedRawData.goal,
                    startDate: Timestamp.fromDate(new Date(importedRawData.goal.startDate)),
                    endDate: Timestamp.fromDate(new Date(importedRawData.goal.endDate)),
                  }
                : null;

              const newStateOnImport: AppState = {
                goal: importedGoalWithTimestamps,
                notToDoList: importedRawData.notToDoList || [],
                contextItems: importedRawData.contextItems || [],
                toDoList: importedRawData.toDoList || [],
              };
              setAppState(newStateOnImport);
              showMessage('Data imported successfully!', 'success');
            }
          );
        } catch (error: any) {
          showMessage(
            `Invalid file format or data: ${error.message || 'Unknown error'}. Please select a valid JSON backup file.`,
            'error'
          );
        } finally {
          event.target.value = '';
        }
      };
      reader.readAsText(file);
    },
    [showMessage, openConfirmationModal]
  );

  // --- Countdown Calculation & Display (Now directly in Dashboard) ---
  const [_, setTick] = useState(0); // State to force re-render for countdown, actual time calc happens in render
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized functions for urgency and motivational message
  const getUrgencyLevel = useCallback((timeLeft: number, totalTime: number): UrgencyLevel => {
    const ratio = timeLeft / totalTime;
    if (ratio > 0.5) return 'low';
    if (ratio > 0.2) return 'medium';
    return 'high';
  }, []);

  const getMotivationalMessage = useCallback((urgency: UrgencyLevel, timeLeft: number): string => {
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    if (urgency === 'high') {
      return days > 1 ? "Final sprint! You've got this!" : 'The final hour approaches!';
    } else if (urgency === 'medium') {
      return 'Stay focused and keep pushing forward!';
    } else {
      return 'Great pace! Keep up the momentum!';
    }
  }, []);

  // Effect to manage the countdown interval
  useEffect(() => {
    if (appState.goal) {
      const endDate = appState.goal.endDate.toDate(); // Convert Timestamp to Date
      if (endDate.getTime() > Date.now()) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = setInterval(() => {
          setTick(prev => prev + 1); // Trigger re-render every second
        }, 1000);
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      }
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
    // Only re-run if appState.goal changes, not on every tick. The tick state handles re-render.
  }, [appState.goal]);

  // Calculations for display
  const goalEndDate = appState.goal ? appState.goal.endDate.toDate() : null;
  const goalStartDate = appState.goal ? appState.goal.startDate.toDate() : null;
  const now = new Date();

  const timeLeft = goalEndDate ? goalEndDate.getTime() - now.getTime() : 0;
  const totalTime =
    goalEndDate && goalStartDate ? goalEndDate.getTime() - goalStartDate.getTime() : 1; // Avoid division by zero
  const progressPercent = Math.min(
    goalStartDate ? ((now.getTime() - goalStartDate.getTime()) / totalTime) * 100 : 0,
    100
  );

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const urgency: UrgencyLevel =
    appState.goal && timeLeft > 0 ? getUrgencyLevel(timeLeft, totalTime) : 'low';
  const motivationalMessage =
    appState.goal && timeLeft > 0
      ? getMotivationalMessage(urgency, timeLeft)
      : appState.goal && timeLeft <= 0
        ? 'Goal achieved! Time to set a new one or celebrate this accomplishment.'
        : 'Set a new goal to start your focused journey!'; // Fallback for no goal

  // --- UI Rendering ---
  // Display loading indicator if authentication check or data loading is in progress
  if (authLoading || dataLoading) {
    return (
      <main className="flex justify-center items-center min-h-screen text-white bg-black font-poppins">
        <p className="text-xl text-white/70">
          {authLoading ? 'Authenticating...' : 'Loading your data...'}
        </p>
        {/* Show toasts even during loading */}
        <ToastMessage message={toastMessage} type={toastType} duration={5000} />
      </main>
    );
  }

  // Dashboard content is always shown if appMode is 'google' or 'guest'
  // If appMode is 'none' and not loading, it implies a redirect to login has occurred or is pending.
  if (appMode === 'none') {
    return (
      <main className="flex justify-center items-center min-h-screen text-white bg-black font-poppins">
        <p className="text-xl text-white/70">Redirecting to login...</p>
      </main>
    );
  }

  // Transform goal data for GoalModal (which expects string dates)
  const transformedGoalForModal = appState.goal
    ? {
        ...appState.goal,
        startDate: appState.goal.startDate.toDate().toISOString(),
        endDate: appState.goal.endDate.toDate().toISOString(),
      }
    : null;

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      {/* NavBar Component */}
      <NavBar
        currentUser={currentUser}
        appMode={appMode}
        onSignOut={handleSignOut}
        onNewGoal={handleNewGoal}
        onExport={exportData}
        onImport={() => document.getElementById('importFile')?.click()}
        onOpenDeveloperModal={openDeveloperModal}
        onOpenGoalModal={openGoalModal}
        onEditGoal={handleEditGoal}
        onSignInWithGoogleFromGuest={handleSignInWithGoogleFromGuest}
      />
      <input
        type="file"
        id="importFile"
        accept=".json"
        style={{ display: 'none' }}
        onChange={importData}
      />

      {/* Toast Message Component */}
      <ToastMessage message={toastMessage} type={toastType} duration={5000} />

      {/* Confirmation Modal Component */}
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={closeConfirmationModal}
        message={confirmationMessage}
        title={confirmationTitle}
        cancelButton={{
          text: 'Cancel',
          onClick: closeConfirmationModal,
          className: 'btn-secondary',
        }}
        confirmButton={{
          text: 'Confirm',
          onClick: handleConfirmation,
          className: 'btn-primary bg-red-500 hover:bg-red-600 focus:ring-red-400',
        }}
      />

      <div className="container flex-grow p-4 mx-auto max-w-4xl">
        <main className="py-8">
          {!appState.goal ? (
            <section
              id="noGoalMessage"
              className="p-10 mb-8 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300"
            >
              <div className="mb-6">
                <MdRocketLaunch className="mx-auto w-20 h-20 text-white/70" />
              </div>
              <h2 className="mb-4 text-3xl font-bold text-white">Start Your Journey</h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-white/70">
                Define your primary objective and begin tracking your progress toward success.
              </p>
              <div className="flex flex-col gap-4 justify-center sm:flex-row">
                {' '}
                {/* Added a flex container for buttons */}
                <button
                  className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 group hover:bg-white/90 hover:scale-105 hover:shadow-xl"
                  onClick={openGoalModal}
                >
                  <FiTarget size={20} />
                  Set Your First Goal
                </button>
                <button
                  className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-white bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-full transition-all duration-300 hover:bg-white/[0.04] hover:border-white/20 hover:scale-105"
                  onClick={() => document.getElementById('importFile')?.click()}
                >
                  <FiUpload size={20} />
                  Import Data
                </button>
              </div>
            </section>
          ) : (
            <>
              {/* Goal Display and Countdown */}
              <section id="countdownSection">
                <div className="p-8 mb-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300">
                  <div className="flex flex-col justify-between items-start pb-4 mb-6 border-b border-white/10 md:flex-row md:items-center">
                    <div>
                      <h2 id="goalTitle" className="mb-2 text-3xl font-bold text-white">
                        {appState.goal.name}
                      </h2>
                      {appState.goal.description && (
                        <p className="italic leading-relaxed text-white/70 text-md">
                          {appState.goal.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 items-center mt-4 text-sm text-white/50 md:mt-0">
                      <span>Started:</span>
                      <span id="startDate" className="font-medium text-white/80">
                        {goalStartDate?.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Countdown Display */}
                  <div className="grid grid-cols-2 gap-6 pt-4 mb-8 md:grid-cols-4">
                    <div className="p-4 text-center rounded-lg shadow-sm bg-white/5">
                      <span
                        className={`block mx-auto mb-1 text-5xl font-extrabold countdown-number ${timeLeft <= 0 ? 'text-white/40' : urgency === 'high' ? 'text-red-400' : urgency === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}
                      >
                        {Math.max(0, days)}
                      </span>
                      <span className="text-sm font-medium text-white/70">Days</span>
                    </div>
                    <div className="p-4 text-center rounded-lg shadow-sm bg-white/5">
                      <span
                        className={`block mx-auto mb-1 text-5xl font-extrabold countdown-number ${timeLeft <= 0 ? 'text-white/40' : urgency === 'high' ? 'text-red-400' : urgency === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}
                      >
                        {Math.max(0, hours)}
                      </span>
                      <span className="text-sm font-medium text-white/70">Hours</span>
                    </div>
                    <div className="p-4 text-center rounded-lg shadow-sm bg-white/5">
                      <span
                        className={`block mx-auto mb-1 text-5xl font-extrabold countdown-number ${timeLeft <= 0 ? 'text-white/40' : urgency === 'high' ? 'text-red-400' : urgency === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}
                      >
                        {Math.max(0, minutes)}
                      </span>
                      <span className="text-sm font-medium text-white/70">Minutes</span>
                    </div>
                    <div className="p-4 text-center rounded-lg shadow-sm bg-white/5">
                      <span
                        className={`block mx-auto mb-1 text-5xl font-extrabold countdown-number ${timeLeft <= 0 ? 'text-white/40' : urgency === 'high' ? 'text-red-400' : urgency === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}
                      >
                        {Math.max(0, seconds)}
                      </span>
                      <span className="text-sm font-medium text-white/70">Seconds</span>
                    </div>
                  </div>

                  {/* Progress Ring & Urgency */}
                  <div className="flex flex-col gap-8 justify-center items-center p-4 mb-6 rounded-lg bg-white/5 md:flex-row">
                    <div className="relative w-40 h-40">
                      <svg width="160" height="160" className="transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          fill="none"
                          stroke="#e5e7eb20"
                          strokeWidth="10"
                        />
                        <circle
                          id="progressCircle"
                          cx="80"
                          cy="80"
                          r="70"
                          fill="none"
                          stroke="#000000"
                          strokeWidth="10"
                          strokeDasharray="439.8"
                          strokeDashoffset={439.8 - (progressPercent / 100) * 439.8}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                          className={
                            timeLeft <= 0
                              ? 'stroke-green-500'
                              : urgency === 'high'
                                ? 'stroke-red-500'
                                : urgency === 'medium'
                                  ? 'stroke-yellow-500'
                                  : 'stroke-blue-500'
                          }
                        />
                      </svg>
                      <div className="flex absolute inset-0 justify-center items-center">
                        <span id="progressPercent" className="text-3xl font-bold text-white">
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                    </div>

                    <div className="text-center md:text-left">
                      <p
                        id="urgencyIndicator"
                        className={`flex items-center justify-center md:justify-start gap-2 mb-2 text-xl font-medium ${timeLeft <= 0 ? 'text-green-500' : urgency === 'high' ? 'text-red-400' : urgency === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}
                      >
                        {timeLeft <= 0 ? (
                          <FiAward className="w-6 h-6 text-green-500" />
                        ) : urgency === 'high' ? (
                          <FiAward className="w-6 h-6 text-red-400" />
                        ) : urgency === 'medium' ? (
                          <FiClock className="w-6 h-6 text-yellow-400" />
                        ) : (
                          <FiTarget className="w-6 h-6 text-green-400" />
                        )}
                        {motivationalMessage}
                      </p>
                      <p id="motivationalMessage" className="text-base italic text-white/70">
                        {motivationalMessage}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {/* Goal Creation Modal Component */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={closeGoalModal}
        onSetGoal={setGoal}
        initialGoalData={goalModalEditMode ? transformedGoalForModal : null}
        isEditMode={goalModalEditMode}
      />

      {/* Developer Information Modal Component */}
      <DeveloperModal isOpen={isDeveloperModalOpen} onClose={closeDeveloperModal} />

      {/* Footer Component */}
      <Footer />
    </main>
  );
}
