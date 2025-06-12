// app/stop-watch/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

// Import types
import { AppState, AppMode } from '@/types';

// Import Firebase service functions
import { firebaseService } from '@/services/firebaseService';

// Import Local Storage service functions
import { localStorageService } from '@/services/localStorageService';

// Component imports
import NavBar from '@/components/NavBar';
import ToastMessage from '@/components/ToastMessage';
import ConfirmationModal from '@/components/ConfirmationModal';
import Footer from '@/components/Footer';
import Stopwatch from '@/components/Stopwatch'; // Import the standalone Stopwatch component

// Initial state for the persistent data (this page primarily interacts with appMode and auth)
const initialPersistentAppState: AppState = {
  goal: null,
  notToDoList: [],
  contextItems: [],
  toDoList: [],
};

export default function StopwatchPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [appMode, setAppMode] = useState<AppMode>(localStorageService.getAppModeFromLocalStorage());

  // Although this page doesn't directly display or modify appState lists/goal,
  // we need to load it to maintain consistent state for other pages and ensure
  // a proper user session (especially for Firebase users).
  const [appState, setAppState] = useState<AppState>(initialPersistentAppState);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmationAction, setConfirmationAction] = useState<(() => void) | null>(null);

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  }, []);

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

  // --- Initial App Mode and Data Loading Logic (similar to dashboard/list pages) ---
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
            setAppState(initialPersistentAppState);
            showMessage('Local storage data not found. Starting fresh guest session.', 'info');
            localStorageService.clearLocalState();
          }
        } catch (error: any) {
          showMessage(
            `Error loading guest data: ${error.message || 'Unknown error'}. Starting fresh.`,
            'error'
          );
          setAppState(initialPersistentAppState);
          localStorageService.clearLocalState();
        } finally {
          setDataLoading(false);
          setAuthLoading(false);
        }
      } else if (currentAppMode === 'google') {
        const unsubscribeAuth = firebaseService.onAuthChange(async user => {
          setAuthLoading(false);
          if (user) {
            setCurrentUser(user);
            try {
              const loadedFirebaseData = await firebaseService.loadUserData(user.uid);
              setAppState(loadedFirebaseData); // Load full app state, even if not directly used here
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
      } else {
        const unsubscribeAuth = firebaseService.onAuthChange(async user => {
          setAuthLoading(false);
          if (user) {
            setCurrentUser(user);
            setAppMode('google');
            localStorageService.setAppModeInLocalStorage('google');
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

  // --- Data Persistence Logic (Minimal for this page, just ensure session is active) ---
  // This useEffect intentionally doesn't save appState changes because Stopwatch is standalone.
  // We still need `currentUser`, `appMode`, `authLoading`, `dataLoading` to handle session.
  // The full appState is loaded just to ensure consistency across the app,
  // even if this particular page doesn't directly mutate goal/lists.
  useEffect(() => {
    if (!authLoading && !dataLoading && appMode === 'google' && currentUser) {
      // Potentially, if Stopwatch data was to be persistent, it would be saved here.
      // For now, it's explicitly not persistent, so no save operation.
    }
  }, [currentUser, appMode, authLoading, dataLoading]);

  // --- UI Rendering ---
  if (authLoading || dataLoading) {
    return (
      <main className="flex justify-center items-center min-h-screen text-white bg-black font-poppins">
        <p className="text-xl text-white/70">
          {authLoading ? 'Authenticating...' : 'Loading your data...'}
        </p>
        <ToastMessage message={toastMessage} type={toastType} duration={5000} />
      </main>
    );
  }

  if (appMode === 'none') {
    return (
      <main className="flex justify-center items-center min-h-screen text-white bg-black font-poppins">
        <p className="text-xl text-white/70">Redirecting to login...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <NavBar
        currentUser={currentUser}
        appMode={appMode}
        onSignOut={() => {}} // NavBar handles sign-out on its own dropdown
        onNewGoal={() => {}} // Handled on Dashboard
        onExport={() => {}} // Handled on Dashboard
        onImport={() => {}} // Handled on Dashboard
        onOpenDeveloperModal={() => {}} // Handled via specific button if added to NavBar
        onOpenGoalModal={() => {}} // Handled on Dashboard
        onEditGoal={() => {}} // Handled on Dashboard
        onSignInWithGoogleFromGuest={() => {}} // Handled on Login
      />
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

      <div className="container flex flex-grow justify-center items-center p-4 mx-auto max-w-4xl">
        <section className="py-8 w-full">
          <h2 className="mb-8 text-3xl font-bold text-center text-white">Focus Timer</h2>
          {/* Render the Stopwatch component */}
          <Stopwatch showMessage={showMessage} />
        </section>
      </div>
    </main>
  );
}
