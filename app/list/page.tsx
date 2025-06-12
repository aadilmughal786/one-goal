// app/list/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

// Import types
import { AppState, ListItem, TodoItem, AppMode } from '@/types';

// Import Firebase service functions
import { firebaseService } from '@/services/firebaseService';

// Import Local Storage service functions
import { localStorageService } from '@/services/localStorageService';

// Component imports
import NavBar from '@/components/NavBar';
import ToastMessage from '@/components/ToastMessage';
import ConfirmationModal from '@/components/ConfirmationModal';
import Footer from '@/components/Footer';
import NotToDoList from '@/components/NotToDoList'; // Now imported and used
import ContextList from '@/components/ContextList'; // Now imported and used

// Initial state for the persistent data (this page will specifically use notToDoList and contextItems)
const initialPersistentAppState: AppState = {
  goal: null, // Placeholder, as goal is managed on dashboard
  notToDoList: [],
  contextItems: [],
  toDoList: [], // Placeholder
};

export default function ListsPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [appMode, setAppMode] = useState<AppMode>(localStorageService.getAppModeFromLocalStorage());

  // App state for all persistent data, but this page primarily interacts with notToDoList and contextItems
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

  // --- Data Persistence Logic (saving AppState based on changes to notToDoList and contextItems) ---
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
    appState.notToDoList, // Trigger save on changes to this list
    appState.contextItems, // Trigger save on changes to this list
    appState.goal, // Include other parts of appState that might change indirectly or need to be saved
    appState.toDoList,
    currentUser,
    appMode,
    authLoading,
    dataLoading,
    showMessage,
  ]);

  // --- List Management Functions (for Not To Do and Context Lists) ---
  const addToList = useCallback(
    async (listType: 'notToDoList' | 'contextItems', text: string) => {
      if (!text.trim()) {
        showMessage(
          `Please enter an item for ${listType === 'notToDoList' ? 'What Not To Do' : 'Context'}!`,
          'error'
        );
        return;
      }
      const newItem: ListItem = { text, id: Date.now() };

      if (appMode === 'google' && currentUser) {
        try {
          await firebaseService.addListItem(currentUser.uid, listType, newItem);
          setAppState(prev => ({
            ...prev,
            [listType]: [...prev[listType], newItem],
          }));
          showMessage(
            `${listType === 'notToDoList' ? 'Item added to Not To Do' : 'Context item added'}!`,
            'success'
          );
        } catch (error: any) {
          showMessage(
            `Failed to add item to ${listType}: ${error.message || 'Unknown error'}`,
            'error'
          );
        }
      } else if (appMode === 'guest') {
        setAppState(prev => ({
          ...prev,
          [listType]: [...prev[listType], newItem],
        }));
        showMessage(
          `${listType === 'notToDoList' ? 'Item added to Not To Do' : 'Context item added'}!`,
          'success'
        );
      }
    },
    [showMessage, appMode, currentUser]
  );

  const removeFromList = useCallback(
    async (listType: 'notToDoList' | 'contextItems', id: number) => {
      if (appMode === 'google' && currentUser) {
        try {
          await firebaseService.deleteListItem(currentUser.uid, listType, id);
          setAppState(prev => ({
            ...prev,
            [listType]: prev[listType].filter(item => item.id !== id),
          }));
          showMessage(
            `${listType === 'notToDoList' ? 'Item removed from Not To Do' : 'Context item removed'}!`,
            'info'
          );
        } catch (error: any) {
          showMessage(
            `Failed to remove item from ${listType}: ${error.message || 'Unknown error'}`,
            'error'
          );
        }
      } else if (appMode === 'guest') {
        setAppState(prev => ({
          ...prev,
          [listType]: prev[listType].filter(item => item.id !== id),
        }));
        showMessage(
          `${listType === 'notToDoList' ? 'Item removed from Not To Do' : 'Context item removed'}!`,
          'info'
        );
      }
    },
    [showMessage, appMode, currentUser]
  );

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
        onSignOut={() => {}} // Sign out will trigger from Dashboard or Login if needed
        onNewGoal={() => {}}
        onExport={() => {}}
        onImport={() => {}}
        onOpenDeveloperModal={() => {}}
        onOpenGoalModal={() => {}}
        onEditGoal={() => {}}
        onSignInWithGoogleFromGuest={() => {}}
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

      <div className="container flex-grow p-4 mx-auto max-w-4xl">
        <section className="py-8">
          <h2 className="mb-8 text-3xl font-bold text-center text-white">Your Focused Lists</h2>
          <div className="flex flex-col gap-6">
            {' '}
            {/* Changed from grid to flex col for single column */}
            {/* Not To Do List Component */}
            <NotToDoList
              list={appState.notToDoList}
              addToList={(text: string) => addToList('notToDoList', text)}
              removeFromList={(id: number) => removeFromList('notToDoList', id)}
            />
            {/* Context List Component */}
            <ContextList
              list={appState.contextItems}
              addToList={(text: string) => addToList('contextItems', text)}
              removeFromList={(id: number) => removeFromList('contextItems', id)}
            />
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
