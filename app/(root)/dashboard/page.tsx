// app/(root)/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

// Import types
import { AppState, ListItem, TodoItem, DailyProgress } from '@/types';

// Import Firebase service functions (using the instance)
import { firebaseService } from '@/services/firebaseService';

// Component imports
import GoalModal from '@/components/GoalModal';
import ToastMessage from '@/components/ToastMessage';
import ConfirmationModal from '@/components/ConfirmationModal';
import DailyProgressModal from '@/components/DailyProgressModal'; // New: DailyProgressModal
import DailyProgressGrid from '@/components/DailyProgressGrid'; // New: DailyProgressGrid
import SatisfactionGraph from '@/components/SatisfactionGraph'; // New: SatisfactionGraph

// Icon imports
import { MdRocketLaunch } from 'react-icons/md';
import { FiTarget, FiClock, FiEdit, FiPlusCircle } from 'react-icons/fi';

// Define types for raw data loaded from storage, before normalization
type DateLike =
  | Date
  | Timestamp
  | string
  | number
  | { seconds: number; nanoseconds?: number }
  | null
  | undefined;

interface RawGoalData {
  name: string;
  description?: string;
  startDate: DateLike;
  endDate: DateLike;
}

interface RawDailyProgress {
  date: DateLike;
  satisfactionLevel: number;
  notes?: string;
}

interface RawAppState {
  goal?: RawGoalData | null;
  notToDoList?: ListItem[];
  contextItems?: ListItem[];
  toDoList?: TodoItem[];
  dailyProgress?: RawDailyProgress[]; // Use RawDailyProgress for initial load
}

// Initial state for the persistent data (conforms to AppState type)
const initialPersistentAppState: AppState = {
  goal: null,
  notToDoList: [],
  contextItems: [],
  toDoList: [],
  dailyProgress: [],
};

// Helper function to safely convert date to Date object from various formats
const safeToDate = (dateValue: DateLike): Date | null => {
  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    return dateValue;
  }

  if (dateValue instanceof Timestamp) {
    return dateValue.toDate();
  }

  if (
    typeof dateValue === 'object' &&
    dateValue !== null &&
    'seconds' in dateValue &&
    typeof dateValue.seconds === 'number'
  ) {
    return new Date(dateValue.seconds * 1000 + (dateValue.nanoseconds || 0) / 1000000);
  }

  if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    const parsedDate = new Date(dateValue);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  return null;
};

// Helper function to normalize AppState after loading from any source
const normalizeAppState = (loadedState: RawAppState): AppState => {
  if (!loadedState) return initialPersistentAppState;

  const normalized: AppState = {
    goal: null,
    notToDoList: loadedState.notToDoList || [],
    contextItems: loadedState.contextItems || [],
    toDoList: loadedState.toDoList || [],
    dailyProgress: [],
  };

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

  if (Array.isArray(loadedState.dailyProgress)) {
    normalized.dailyProgress = loadedState.dailyProgress.map(entry => {
      const date = safeToDate(entry.date);
      // Ensure notes is a string, and satisfaction level is a number
      return {
        date: date ? Timestamp.fromDate(date) : Timestamp.now(),
        satisfactionLevel:
          typeof entry.satisfactionLevel === 'number' ? entry.satisfactionLevel : 3, // Default to 3 if not number
        notes: entry.notes || '',
      };
    });
  }

  return normalized;
};

export default function DashboardPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const [appState, setAppState] = useState<AppState>(initialPersistentAppState);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalModalEditMode, setGoalModalEditMode] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmationAction, setConfirmationAction] = useState<(() => void) | null>(null);

  // New state for DailyProgressModal
  const [isDailyProgressModalOpen, setIsDailyProgressModalOpen] = useState(false);
  const [selectedDayForProgress, setSelectedDayForProgress] = useState<Date | null>(null);
  const [initialDailyProgressData, setInitialDailyProgressData] = useState<DailyProgress | null>(
    null
  );

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

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  }, []);

  // --- Initial Data Loading Logic (Firebase only) ---
  useEffect(() => {
    const loadInitialData = async () => {
      setDataLoading(true);
      setAuthLoading(true);

      const unsubscribeAuth = firebaseService.onAuthChange(async user => {
        setAuthLoading(false);

        if (user) {
          setCurrentUser(user);
          try {
            const loadedFirebaseData = await firebaseService.loadUserData(user.uid);
            const normalizedData = normalizeAppState(loadedFirebaseData);
            setAppState(normalizedData);
          } catch (firebaseLoadError: unknown) {
            let errorMessage = 'Unknown error';
            if (firebaseLoadError instanceof Error) {
              errorMessage = firebaseLoadError.message;
            }
            showMessage(`Failed to load Firebase data: ${errorMessage}`, 'error');
            setAppState(initialPersistentAppState);
          }
        } else {
          setCurrentUser(null);
          router.replace('/login');
        }
        setDataLoading(false);
      });
      return () => unsubscribeAuth();
    };

    loadInitialData();
  }, [router, showMessage]);

  // --- Data Persistence Logic (Firebase only) ---
  useEffect(() => {
    if (!authLoading && !dataLoading && currentUser) {
      const dataToSave: AppState = appState;

      firebaseService.saveUserData(currentUser.uid, dataToSave).catch((error: unknown) => {
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        showMessage(`Failed to save data to Firebase: ${errorMessage}`, 'error');
      });
    }
  }, [
    appState.goal,
    appState.notToDoList,
    appState.contextItems,
    appState.toDoList,
    appState.dailyProgress,
    currentUser,
    authLoading,
    dataLoading,
    showMessage,
    appState,
  ]);

  // --- Goal Modal Functions ---
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
      appState.toDoList.length > 0 ||
      appState.dailyProgress.length > 0
    ) {
      openConfirmationModal(
        'Create New Goal',
        'Creating a new goal will remove all your existing data. Are you sure you want to proceed?',
        () => {
          setAppState(initialPersistentAppState);
          openGoalModal();
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
    appState.dailyProgress,
    openConfirmationModal,
    openGoalModal,
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

  // --- Daily Progress Modal Functions ---
  const handleOpenDailyProgressModal = useCallback(
    (date: Date, initialProgress?: DailyProgress | null) => {
      setSelectedDayForProgress(date);
      setInitialDailyProgressData(initialProgress || null);
      setIsDailyProgressModalOpen(true);
    },
    []
  );

  const handleCloseDailyProgressModal = useCallback(() => {
    setIsDailyProgressModalOpen(false);
    setSelectedDayForProgress(null);
    setInitialDailyProgressData(null);
  }, []);

  const handleSaveDailyProgress = useCallback(
    async (date: Date, satisfactionLevel: number, notes?: string) => {
      if (!currentUser) {
        showMessage('You must be logged in to save daily progress.', 'error');
        return;
      }

      const newProgress: DailyProgress = {
        date: Timestamp.fromDate(date),
        satisfactionLevel: satisfactionLevel,
        notes: notes || '',
      };

      try {
        await firebaseService.addOrUpdateDailyProgress(currentUser.uid, newProgress);
        // Update local appState with the new/updated progress
        setAppState(prev => {
          const existingDailyProgress = prev.dailyProgress || [];
          const newProgressDateKey = newProgress.date.toDate().toISOString().slice(0, 10);

          let updatedDailyProgress: DailyProgress[];
          const existingIndex = existingDailyProgress.findIndex(
            item => item.date.toDate().toISOString().slice(0, 10) === newProgressDateKey
          );

          if (existingIndex > -1) {
            updatedDailyProgress = [...existingDailyProgress];
            updatedDailyProgress[existingIndex] = newProgress;
          } else {
            updatedDailyProgress = [...existingDailyProgress, newProgress];
          }
          return { ...prev, dailyProgress: updatedDailyProgress };
        });

        showMessage(`Progress for ${date.toLocaleDateString()} saved successfully!`, 'success');
        handleCloseDailyProgressModal();
      } catch (error: unknown) {
        showMessage(`Failed to save daily progress: ${(error as Error).message}`, 'error');
      }
    },
    [currentUser, showMessage, handleCloseDailyProgressModal]
  );

  // --- Countdown Calculation & Display ---
  const [, setTick] = useState(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const goalEndDate = appState.goal ? safeToDate(appState.goal.endDate) : null;
  const goalStartDate = appState.goal ? safeToDate(appState.goal.startDate) : null;

  useEffect(() => {
    if (appState.goal && goalEndDate) {
      if (goalEndDate.getTime() > Date.now()) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = setInterval(() => {
          setTick(prev => prev + 1);
        }, 1000);
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      }
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
  }, [appState.goal, goalEndDate]);

  const now = new Date();

  const timeLeft = goalEndDate ? goalEndDate.getTime() - now.getTime() : 0;
  const totalTime =
    goalEndDate && goalStartDate ? goalEndDate.getTime() - goalStartDate.getTime() : 1;
  const progressPercent = Math.min(
    goalStartDate ? ((now.getTime() - goalStartDate.getTime()) / totalTime) * 100 : 0,
    100
  );

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const motivationalMessage =
    appState.goal && timeLeft > 0
      ? `Time remaining for your goal:`
      : appState.goal && timeLeft <= 0
        ? 'Goal period ended. Time to set a new one or celebrate this accomplishment!'
        : 'Set a new goal to start your focused journey!';

  const transformedGoalForModal =
    appState.goal && goalStartDate && goalEndDate
      ? {
          name: appState.goal.name,
          description: appState.goal.description,
          startDate: goalStartDate.toISOString(),
          endDate: goalEndDate.toISOString(),
        }
      : null;

  // --- Skeleton Loader Component ---
  const SkeletonLoader = () => (
    <div className="animate-pulse">
      <div className="p-10 mb-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-white/10"></div>
        <div className="mx-auto mb-4 w-3/4 h-8 rounded-md bg-white/10"></div>
        <div className="mx-auto mb-8 w-1/2 h-6 rounded-md bg-white/10"></div>
        <div className="flex flex-col gap-4 justify-center sm:flex-row">
          <div className="w-48 h-12 rounded-full bg-white/10"></div>
        </div>
      </div>

      <div className="p-8 mb-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <div className="mb-6 w-1/2 h-8 rounded-md bg-white/10"></div>
        <div className="mb-4 w-1/4 h-4 rounded-md bg-white/10"></div>
        <div className="mb-8 w-full h-6 rounded-md bg-white/10"></div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 h-28 text-center rounded-lg shadow-sm bg-white/5">
              <div className="mx-auto mb-2 w-3/4 h-10 rounded-md bg-white/10"></div>
              <div className="mx-auto w-1/2 h-4 rounded-md bg-white/10"></div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-8 justify-center items-center p-4 mb-6 rounded-lg bg-white/5 md:flex-row">
          <div className="w-40 h-40 rounded-full bg-white/10"></div>
          <div className="flex-1 w-full">
            <div className="mb-2 w-3/4 h-6 rounded-md bg-white/10"></div>
            <div className="w-full h-4 rounded-md bg-white/10"></div>
          </div>
        </div>
      </div>

      <div className="py-8">
        <div className="mx-auto mb-6 w-1/3 h-8 rounded-md bg-white/10"></div>
        <div className="grid gap-4 grid-cols-auto-fit-100">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl text-center bg-white/[0.05] h-32">
              <div className="mb-2 ml-auto w-1/4 h-4 rounded-md bg-white/10"></div>
              <div className="mx-auto mb-2 w-1/2 h-10 rounded-md bg-white/10"></div>
              <div className="mx-auto w-1/2 h-4 rounded-md bg-white/10"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // --- UI Rendering ---
  if (authLoading || dataLoading) {
    return (
      <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
        <div className="container flex-grow p-4 mx-auto max-w-4xl">
          <SkeletonLoader />
        </div>
        <ToastMessage message={toastMessage} type={toastType} duration={5000} />
      </main>
    );
  }

  if (!currentUser) {
    router.replace('/login');
    return (
      <main className="flex justify-center items-center min-h-screen text-white bg-black font-poppins">
        <p className="text-xl text-white/70">Redirecting to login...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <ToastMessage message={toastMessage} type={toastType} duration={5000} />
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
      {selectedDayForProgress && (
        <DailyProgressModal
          isOpen={isDailyProgressModalOpen}
          onClose={handleCloseDailyProgressModal}
          date={selectedDayForProgress}
          initialProgress={initialDailyProgressData}
          onSave={handleSaveDailyProgress}
          showMessage={showMessage}
        />
      )}

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
                <button
                  className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 group hover:bg-white/90 hover:scale-105 hover:shadow-xl"
                  onClick={openGoalModal}
                >
                  <FiTarget size={20} />
                  Set Your First Goal
                </button>
              </div>
            </section>
          ) : (
            <>
              {/* Goal Display and Countdown */}
              <section id="countdownSection">
                <div className="p-8 mb-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300">
                  <div className="pb-4 mb-6 border-b border-white/10">
                    <div className="flex flex-wrap gap-3 justify-between items-center w-full">
                      <h2 id="goalTitle" className="mb-2 text-3xl font-bold text-white">
                        {appState.goal.name}
                      </h2>

                      <button
                        onClick={handleEditGoal}
                        className="inline-flex cursor-pointer gap-2 items-center px-4 py-2 font-semibold text-sm text-white bg-white/[0.05] rounded-full border border-white/10 shadow-lg transition-colors duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                      >
                        <FiEdit className="w-4 h-4" /> Update Goal
                      </button>
                    </div>

                    <div className="flex gap-2 items-center mt-4 text-sm text-white/50">
                      <span>Started:</span>
                      <span id="startDate" className="font-medium text-white/80">
                        {goalStartDate?.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {appState.goal.description && (
                      <p className="mt-2 italic leading-relaxed text-white/70 text-md">
                        {appState.goal.description}
                      </p>
                    )}
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
                          className={'stroke-blue-500'}
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
                          Your goal is to achieve: &quot;{appState.goal.name}&quot; by{' '}
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

              {/* Goal Tracking Grid Section */}
              <section id="goalTrackingGrid" className="py-8">
                <h2 className="mb-6 text-3xl font-bold text-center text-white">
                  Your Daily Progress
                </h2>
                <DailyProgressGrid
                  goal={appState.goal}
                  dailyProgress={appState.dailyProgress}
                  onDayClick={handleOpenDailyProgressModal}
                />
              </section>

              {/* Satisfaction Graph Section */}
              <section id="satisfactionGraph" className="py-8">
                <SatisfactionGraph dailyProgress={appState.dailyProgress} />
              </section>
            </>
          )}

          {/* New Goal Button at the end */}
          <section className="py-8 text-center">
            <button
              onClick={handleNewGoal}
              className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-white bg-red-600 rounded-full transition-all duration-200 cursor-pointer group hover:bg-red-700 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <FiPlusCircle size={20} />
              Set New Goal
            </button>
          </section>
        </main>
      </div>
      {/* Goal Creation Modal Component */}
      <GoalModal
        key={appState.goal?.startDate?.toMillis() || 'new-goal-dashboard'}
        isOpen={isGoalModalOpen}
        onClose={closeGoalModal}
        onSetGoal={setGoal}
        initialGoalData={goalModalEditMode ? transformedGoalForModal : null}
        isEditMode={goalModalEditMode}
      />
    </main>
  );
}
