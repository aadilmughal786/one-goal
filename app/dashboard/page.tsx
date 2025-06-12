// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useSearchParams, useRouter } from 'next/navigation';

// Import types
import { AppState, ListItem, UrgencyLevel, GoalData, AppMode } from '@/types'; // Import AppMode

// Import Firebase service functions
import {
  onAuthChange,
  signOutUser,
  loadUserData as loadFirebaseData,
  saveUserData as saveFirebaseData,
} from '@/services/firebaseService';

// Import Local Storage service functions
import {
  loadLocalState,
  saveLocalState,
  clearLocalState,
  hasLocalData,
  getAppModeFromLocalStorage,
  setAppModeInLocalStorage,
  clearAppModeFromLocalStorage,
} from '@/services/localStorageService';

// Component imports
import NavBar from '@/components/NavBar';
import GoalModal from '@/components/GoalModal';
import ToastMessage from '@/components/ToastMessage';
import NotToDoList from '@/components/NotToDoList';
import ContextList from '@/components/ContextList';
import Footer from '@/components/Footer';
import DeveloperModal from '@/components/DeveloperModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import GoalCountdown from '@/components/GoalCountdown';

// Icon imports (keep only those used directly in this component for main section)
import { MdRocketLaunch } from 'react-icons/md';
import { FiTarget } from 'react-icons/fi';

// Initial state for new users or when no data is found
const initialAppState: AppState = {
  goalData: null,
  notToDoList: [],
  pastList: [],
  stopwatch: {
    running: false,
    time: 0,
    lastStart: null,
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Tracks if Firebase auth check is complete
  const [dataLoading, setDataLoading] = useState(true); // Tracks if data (from any source) is being loaded

  // Initialize appMode directly from local storage
  const [appMode, setAppMode] = useState<AppMode>(getAppModeFromLocalStorage()); // Initialize directly from localStorage

  const [appState, setAppState] = useState<AppState>(initialAppState);
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

      const currentAppMode = appMode; // Use the appMode state, which is already initialized from local storage

      if (currentAppMode === 'guest') {
        try {
          const loadedGuestData = loadLocalState();
          if (loadedGuestData) {
            setAppState({ ...loadedGuestData, stopwatch: initialAppState.stopwatch });
            showMessage('Guest data loaded from local storage.', 'info');
          } else {
            // AppMode was 'guest' but no data found (e.g., cleared manually outside app flow)
            setAppState(initialAppState);
            showMessage(
              'Local storage data not found or corrupted. Starting fresh guest session.',
              'info'
            );
            clearLocalState(); // Clear any corrupted local data
            clearAppModeFromLocalStorage(); // Clear mode
            setAppMode('none'); // Revert mode
            router.replace('/login'); // Redirect to login
            return;
          }
        } catch (error: any) {
          // Error loading from local storage (e.g., parsing error from localStorageService)
          showMessage(
            `Error loading guest data: ${error.message || 'Unknown error'}. Starting fresh.`,
            'error'
          );
          setAppState(initialAppState);
          clearLocalState();
          clearAppModeFromLocalStorage();
          setAppMode('none');
          router.replace('/login');
          return;
        } finally {
          setDataLoading(false);
          setAuthLoading(false); // Auth not directly needed for guest path
        }
      } else if (currentAppMode === 'google') {
        // Proceed with Firebase auth check
        const unsubscribeAuth = onAuthChange(async user => {
          setAuthLoading(false); // Firebase auth check complete

          if (user) {
            setCurrentUser(user);
            try {
              const loadedFirebaseData = await loadFirebaseData(user.uid, initialAppState);
              setAppState(loadedFirebaseData);
              showMessage('Firebase data loaded.', 'success');
            } catch (firebaseLoadError: any) {
              showMessage(
                `Failed to load Firebase data: ${firebaseLoadError.message || 'Unknown error'}`,
                'error'
              );
              setAppState(initialAppState);
            }
          } else {
            // AppMode was 'google' but no active Firebase user, session expired or logged out
            setCurrentUser(null);
            setAppMode('none'); // Fallback to none mode
            clearAppModeFromLocalStorage(); // Clear stale 'google' mode
            router.replace('/login'); // Redirect
          }
          setDataLoading(false); // Data loading complete for Firebase path
        });
        return () => unsubscribeAuth(); // Cleanup Firebase listener
      } else {
        // currentAppMode === 'none' (or initially not set)
        // Fallback to Firebase auth check (or redirect if no user)
        const unsubscribeAuth = onAuthChange(async user => {
          setAuthLoading(false); // Firebase auth check complete

          if (user) {
            setCurrentUser(user);
            setAppMode('google'); // Set mode based on active user
            setAppModeInLocalStorage('google'); // Persist mode
            try {
              const loadedFirebaseData = await loadFirebaseData(user.uid, initialAppState);
              setAppState(loadedFirebaseData);
              showMessage('Firebase data loaded.', 'success');
            } catch (firebaseLoadError: any) {
              showMessage(
                `Failed to load Firebase data: ${firebaseLoadError.message || 'Unknown error'}`,
                'error'
              );
              setAppState(initialAppState);
            }
          } else {
            setCurrentUser(null);
            setAppMode('none'); // Confirm mode is none
            clearAppModeFromLocalStorage(); // Ensure no lingering mode
            router.replace('/login'); // Redirect to login
          }
          setDataLoading(false); // Data loading complete
        });
        return () => unsubscribeAuth(); // Cleanup Firebase listener
      }
    };

    loadInitialData();
  }, [router, showMessage, appMode]); // Dependency on appMode is correct as useState sets it on first render

  // --- Data Persistence Logic (Firebase vs Local Storage) ---
  useEffect(() => {
    // Only save if initial loading is complete AND appMode is established (not 'none')
    if (!authLoading && !dataLoading && appMode !== 'none') {
      const { stopwatch, ...persistentDataToSave } = appState; // Exclude stopwatch

      if (appMode === 'google' && currentUser) {
        // Save to Firebase for logged-in users
        saveFirebaseData(currentUser.uid, persistentDataToSave).catch(error => {
          showMessage(
            `Failed to save data to Firebase: ${error.message || 'Unknown error'}`,
            'error'
          );
        });
      } else if (appMode === 'guest') {
        // Save to Local Storage for guest users
        saveLocalState(persistentDataToSave);
      }
    }
  }, [
    appState.goalData,
    appState.notToDoList,
    appState.pastList,
    currentUser,
    appMode, // Depend on appMode to trigger saving logic
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
            await signOutUser();
            showMessage('Signed out successfully!', 'success');
          } else if (appMode === 'guest') {
            // Guest logout: data remains in local storage.
            // It is cleared only on login page upon successful Google sign-in (migration).
            showMessage('Guest session ended. Your data is saved locally.', 'success');
          }
          clearAppModeFromLocalStorage(); // Clear mode from local storage
          setAppMode('none'); // Explicitly set mode to none in state
          router.replace('/'); // Redirect to landing page after sign out
        } catch (error: any) {
          showMessage(`Sign-out error: ${error.message || 'Unknown error'}`, 'error');
        }
      }
    );
  }, [showMessage, openConfirmationModal, router, appMode, currentUser]);

  const handleSignInWithGoogleFromGuest = useCallback(() => {
    router.push('/login'); // Redirect to login page where the actual sign-in flow is
  }, [router]);

  // --- Modal Functions ---
  const openGoalModal = useCallback(() => {
    setGoalModalEditMode(false); // Always set to create mode when opening from "Set Your First Goal" or "New Goal"
    setIsGoalModalOpen(true);
  }, []);
  const closeGoalModal = useCallback(() => setIsGoalModalOpen(false), []);
  const openDeveloperModal = useCallback(() => setIsDeveloperModalOpen(true), []);
  const closeDeveloperModal = useCallback(() => setIsDeveloperModalOpen(false), []); // Corrected function call

  const handleEditGoal = useCallback(() => {
    if (appState.goalData) {
      setGoalModalEditMode(true); // Set to edit mode
      setIsGoalModalOpen(true);
    } else {
      showMessage('No goal set to update. Please create a new goal first.', 'info');
    }
  }, [appState.goalData, showMessage]);

  const handleNewGoal = useCallback(() => {
    if (appState.goalData) {
      openConfirmationModal(
        'Create New Goal',
        'Creating a new goal will remove your existing goal data. Are you sure you want to proceed?',
        () => {
          setAppState(initialAppState); // Reset app state to initial
          openGoalModal(); // Then open the goal creation modal
          showMessage('Starting a new goal. Your previous data has been cleared.', 'info');
        }
      );
    } else {
      openGoalModal(); // No existing goal, just open the modal
    }
  }, [appState.goalData, openConfirmationModal, openGoalModal, showMessage]);

  // --- Goal Management Functions ---
  const setGoal = useCallback(
    (goalName: string, endDateStr: string, description?: string) => {
      const startDate =
        goalModalEditMode && appState.goalData?.startDate
          ? appState.goalData.startDate.toString()
          : new Date().toISOString();
      const goalEndDate = new Date(endDateStr);

      if (!goalName.trim() || goalEndDate <= new Date()) {
        showMessage(
          'Invalid goal or date. Please ensure goal name is not empty and date is in the future.',
          'error'
        );
        return;
      }

      setAppState(prev => ({
        ...prev,
        goalData: {
          name: goalName,
          description: description || '',
          startDate: startDate,
          endDate: goalEndDate.toISOString(),
        },
      }));
      closeGoalModal();
      showMessage(
        goalModalEditMode ? 'Goal updated successfully!' : 'Goal set successfully!',
        'success'
      );
    },
    [closeGoalModal, showMessage, goalModalEditMode, appState.goalData]
  );

  const resetGoal = useCallback(() => {
    openConfirmationModal(
      'Reset Goal',
      'Are you sure you want to reset your goal? This will delete all progress and cannot be undone.',
      () => {
        setAppState(initialAppState);
        showMessage('Goal reset!', 'info');
      }
    );
  }, [showMessage, openConfirmationModal]);

  // --- List Management ---
  const addToList = useCallback(
    (listType: 'notToDoList' | 'pastList', text: string) => {
      if (!text.trim()) {
        showMessage(
          `Please enter an item for ${listType === 'notToDoList' ? 'What Not To Do' : 'Context'}!`,
          'error'
        );
        return;
      }
      setAppState(prev => ({
        ...prev,
        [listType]: [...prev[listType], { text, id: Date.now() }],
      }));
      showMessage(
        `${listType === 'notToDoList' ? 'Item added to Not To Do' : 'Context item added'}!`,
        'success'
      );
    },
    [showMessage]
  );

  const removeFromList = useCallback(
    (listType: 'notToDoList' | 'pastList', id: number) => {
      setAppState(prev => ({
        ...prev,
        [listType]: prev[listType].filter(item => item.id !== id),
      }));
      showMessage(
        `${listType === 'notToDoList' ? 'Item removed from Not To Do' : 'Context item removed'}!`,
        'info'
      );
    },
    [showMessage]
  );

  // --- Export/Import Data ---
  const exportData = useCallback(() => {
    const dataToExport = appState;
    const isFirebaseUser = appMode === 'google';

    if (
      !dataToExport ||
      (!dataToExport.goalData &&
        dataToExport.notToDoList.length === 0 &&
        dataToExport.pastList.length === 0)
    ) {
      showMessage('No persistent data to export!', 'info');
      return;
    }

    try {
      const { stopwatch, ...persistentData } = dataToExport;
      const dataStr = JSON.stringify(persistentData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `one-goal-backup-${isFirebaseUser ? 'firebase' : 'guest'}-${new Date().toISOString().split('T')[0]}.json`;
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
          const importedData = JSON.parse(e.target?.result as string);
          if (
            typeof importedData !== 'object' ||
            importedData === null ||
            !(
              'goalData' in importedData ||
              'notToDoList' in importedData ||
              'pastList' in importedData
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
              const newStateOnImport: AppState = {
                ...importedData,
                stopwatch: initialAppState.stopwatch,
              } as AppState;
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

  // --- UI Rendering ---
  // Display loading indicator if authentication check or data loading is in progress
  if (authLoading || dataLoading) {
    return (
      <main className="flex justify-center items-center min-h-screen text-gray-900 bg-gray-50 font-poppins">
        <p className="text-xl text-gray-700">
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
      <main className="flex justify-center items-center min-h-screen text-gray-900 bg-gray-50 font-poppins">
        <p className="text-xl text-gray-700">Redirecting to login...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen text-gray-900 bg-gray-50 font-poppins">
      {/* NavBar Component */}
      <NavBar
        currentUser={currentUser}
        appMode={appMode} // Pass appMode
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
        buttons={[
          { text: 'Cancel', onClick: closeConfirmationModal, className: 'btn-secondary' },
          {
            text: 'Confirm',
            onClick: handleConfirmation,
            className: 'btn-primary bg-red-500 hover:bg-red-600 focus:ring-red-400',
          },
        ]}
      />

      <div className="container flex-grow p-4 mx-auto max-w-4xl">
        <main className="py-8">
          {!appState.goalData ? (
            <section
              id="noGoalMessage"
              className="p-10 mb-8 text-center bg-white rounded-xl border border-gray-200 shadow-lg card-hover"
            >
              <div className="mb-6">
                <MdRocketLaunch className="mx-auto w-20 h-20 text-gray-400 opacity-70" />
              </div>
              <h2 className="mb-4 text-3xl font-bold text-gray-900">Start Your Journey</h2>
              <p className="mb-8 text-lg leading-relaxed text-gray-600">
                Define your primary objective and begin tracking your progress toward success.
              </p>
              <button
                className="flex justify-center items-center px-10 py-4 mx-auto text-xl btn-primary"
                onClick={openGoalModal}
              >
                <FiTarget className="inline mr-3 w-6 h-6" />
                Set Your First Goal
              </button>
            </section>
          ) : (
            <>
              {/* Goal Countdown Component */}
              <GoalCountdown goalData={appState.goalData} showMessage={showMessage} />

              {/* Lists Section */}
              <section id="listsSection">
                <div className="grid gap-6 mb-6 md:grid-cols-2">
                  {/* What Not To Do List Component */}
                  <NotToDoList
                    list={appState.notToDoList}
                    addToList={(text: string) => addToList('notToDoList', text)}
                    removeFromList={(id: number) => removeFromList('notToDoList', id)}
                  />

                  {/* Context List Component */}
                  <ContextList
                    list={appState.pastList}
                    addToList={(text: string) => addToList('pastList', text)}
                    removeFromList={(id: number) => removeFromList('pastList', id)}
                  />
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
        initialGoalData={goalModalEditMode ? appState.goalData : null}
        isEditMode={goalModalEditMode}
      />

      {/* Developer Information Modal Component */}
      <DeveloperModal isOpen={isDeveloperModalOpen} onClose={closeDeveloperModal} />

      {/* Footer Component */}
      <Footer />
    </main>
  );
}
