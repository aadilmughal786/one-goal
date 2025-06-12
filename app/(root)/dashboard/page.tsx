// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

// Import types
import { AppState, AppMode } from '@/types'; // UrgencyLevel is still removed from previous request

// Import Firebase service functions (using the instance)
import { firebaseService } from '@/services/firebaseService';

// Import Local Storage service functions (using the instance)
import { localStorageService } from '@/services/localStorageService';

// Component imports
import GoalModal from '@/components/GoalModal';
import ToastMessage from '@/components/ToastMessage';
import ConfirmationModal from '@/components/ConfirmationModal';

// Icon imports
import { MdRocketLaunch } from 'react-icons/md';
import { FiTarget, FiClock, FiUpload, FiEdit, FiPlusCircle } from 'react-icons/fi'; // Added FiPlusCircle for new goal button

// Initial state for the persistent data (conforms to AppState type)
const initialPersistentAppState: AppState = {
  goal: null,
  notToDoList: [],
  contextItems: [],
  toDoList: [],
};

// Helper function to safely convert date to Date object
const safeToDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;

  // If it's already a Date object
  if (dateValue instanceof Date) {
    return dateValue;
  }

  // If it's a Firestore Timestamp
  if (dateValue && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }

  // If it's a string or number, try to parse it
  if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    const parsedDate = new Date(dateValue);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  // If it has seconds and nanoseconds (Timestamp-like object)
  if (dateValue && typeof dateValue.seconds === 'number') {
    return new Date(dateValue.seconds * 1000 + (dateValue.nanoseconds || 0) / 1000000);
  }

  return null;
};

// Helper function to normalize AppState after loading from any source
const normalizeAppState = (loadedState: any): AppState => {
  if (!loadedState) return initialPersistentAppState;

  const normalized: AppState = {
    goal: null,
    notToDoList: loadedState.notToDoList || [],
    contextItems: loadedState.contextItems || [],
    toDoList: loadedState.toDoList || [],
  };

  // Normalize goal dates
  if (loadedState.goal) {
    const startDate = safeToDate(loadedState.goal.startDate);
    const endDate = safeToDate(loadedState.goal.endDate);

    if (startDate && endDate) {
      normalized.goal = {
        name: loadedState.goal.name || '',
        description: loadedState.goal.description || '',
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
      };
    }
  }

  return normalized;
};

export default function DashboardPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Tracks if Firebase auth check is complete
  const [dataLoading, setDataLoading] = useState(true); // Tracks if data (from any source) is being loaded

  // Initialize appMode directly from local storage
  const [appMode, setAppMode] = useState<AppMode>(localStorageService.getAppModeFromLocalStorage());

  // Main application state for persistent data
  const [appState, setAppState] = useState<AppState>(initialPersistentAppState);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalModalEditMode, setGoalModalEditMode] = useState(false);

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
            const normalizedData = normalizeAppState(loadedGuestData);
            setAppState(normalizedData);
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
              const normalizedData = normalizeAppState(loadedFirebaseData);
              setAppState(normalizedData);
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
              const normalizedData = normalizeAppState(loadedFirebaseData);
              setAppState(normalizedData);
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
    appState,
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

  // --- Countdown Calculation & Display ---
  const [_, setTick] = useState(0); // State to force re-render for countdown, actual time calc happens in render
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Safe date conversions for display
  const goalEndDate = appState.goal ? safeToDate(appState.goal.endDate) : null;
  const goalStartDate = appState.goal ? safeToDate(appState.goal.startDate) : null;

  // Effect to manage the countdown interval
  useEffect(() => {
    if (appState.goal && goalEndDate) {
      if (goalEndDate.getTime() > Date.now()) {
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
    // Only re-run if appState.goal or goalEndDate changes, not on every tick. The tick state handles re-render.
  }, [appState.goal, goalEndDate]);

  // Calculations for display
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

  // Simplified motivational message
  const motivationalMessage =
    appState.goal && timeLeft > 0
      ? `Time remaining for your goal:`
      : appState.goal && timeLeft <= 0
        ? 'Goal period ended. Time to set a new one or celebrate this accomplishment!'
        : 'Set a new goal to start your focused journey!';

  // Transform goal data for GoalModal (which expects string dates)
  const transformedGoalForModal =
    appState.goal && goalStartDate && goalEndDate
      ? {
          name: appState.goal.name,
          description: appState.goal.description,
          startDate: goalStartDate.toISOString(),
          endDate: goalEndDate.toISOString(),
        }
      : null;

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

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
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
                  {/* Updated: Added Update Goal Button at the top of the card */}
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={handleEditGoal}
                      className="inline-flex gap-2 items-center px-4 py-2 font-semibold text-sm text-white bg-white/[0.05] rounded-full border border-white/10 shadow-lg transition-colors duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                      <FiEdit className="w-4 h-4" /> Update Goal
                    </button>
                  </div>

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
                        className={`block mx-auto mb-1 text-5xl font-extrabold text-blue-400 countdown-number`}
                      >
                        {Math.max(0, days)}
                      </span>
                      <span className="text-sm font-medium text-white/70">Days</span>
                    </div>
                    <div className="p-4 text-center rounded-lg shadow-sm bg-white/5">
                      <span
                        className={`block mx-auto mb-1 text-5xl font-extrabold text-blue-400 countdown-number`}
                      >
                        {Math.max(0, hours)}
                      </span>
                      <span className="text-sm font-medium text-white/70">Hours</span>
                    </div>
                    <div className="p-4 text-center rounded-lg shadow-sm bg-white/5">
                      <span
                        className={`block mx-auto mb-1 text-5xl font-extrabold text-blue-400 countdown-number`}
                      >
                        {Math.max(0, minutes)}
                      </span>
                      <span className="text-sm font-medium text-white/70">Minutes</span>
                    </div>
                    <div className="p-4 text-center rounded-lg shadow-sm bg-white/5">
                      <span
                        className={`block mx-auto mb-1 text-5xl font-extrabold text-blue-400 countdown-number`}
                      >
                        {Math.max(0, seconds)}
                      </span>
                      <span className="text-sm font-medium text-white/70">Seconds</span>
                    </div>
                  </div>

                  {/* Progress Ring & Motivational Message */}
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
                          className={'stroke-blue-500'} // Fixed color
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
                        id="motivationalMessage"
                        className="flex gap-2 justify-center items-center mb-2 text-xl font-medium md:justify-start text-white/70"
                      >
                        <FiClock className="w-6 h-6 text-blue-400" />
                        {motivationalMessage}
                      </p>
                      {timeLeft > 0 && appState.goal && goalEndDate && (
                        <p className="text-base italic text-white/70">
                          Your goal is to achieve: "{appState.goal.name}" by{' '}
                          {goalEndDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                          .
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* New Goal Button at the end */}
          <section className="py-8 text-center">
            <button
              onClick={handleNewGoal}
              className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-white bg-red-600 rounded-full transition-all duration-200 group hover:bg-red-700 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <FiPlusCircle size={20} />
              Set New Goal
            </button>
          </section>
        </main>
      </div>
      {/* Goal Creation Modal Component */}
      <GoalModal
        key={appState.goal?.startDate?.toMillis() || 'new-goal-dashboard'} // Key to force remount
        isOpen={isGoalModalOpen}
        onClose={closeGoalModal}
        onSetGoal={setGoal}
        initialGoalData={goalModalEditMode ? transformedGoalForModal : null}
        isEditMode={goalModalEditMode}
      />
    </main>
  );
}
