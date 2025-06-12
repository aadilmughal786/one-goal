// app/(root)/list/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// Import types
import { AppState, ListItem } from '@/types';

// Import Firebase service functions
import { firebaseService } from '@/services/firebaseService';

// Component imports
import ToastMessage from '@/components/ToastMessage';
import NotToDoList from '@/components/NotToDoList';
import ContextList from '@/components/ContextList';

// Initial state for the persistent data
const initialPersistentAppState: AppState = {
  goal: null,
  notToDoList: [],
  contextItems: [],
  toDoList: [],
  dailyProgress: [],
};

export default function ListsPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const [appState, setAppState] = useState<AppState>(initialPersistentAppState);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

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
            const normalizedData: AppState = {
              goal: loadedFirebaseData.goal,
              notToDoList: loadedFirebaseData.notToDoList || [],
              contextItems: loadedFirebaseData.contextItems || [],
              toDoList: loadedFirebaseData.toDoList || [],
              dailyProgress: loadedFirebaseData.dailyProgress || [],
            };
            setAppState(normalizedData);
            // Removed: showMessage('Firebase data loaded.', 'success');
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

  // --- Data Persistence Logic ---
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
    appState.notToDoList,
    appState.contextItems,
    appState.goal,
    appState.toDoList,
    appState.dailyProgress,
    currentUser,
    authLoading,
    dataLoading,
    showMessage,
    appState,
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

      if (currentUser) {
        try {
          await firebaseService.addListItem(currentUser.uid, listType, newItem);
          setAppState(prev => ({
            ...prev,
            [listType]: [...prev[listType], newItem],
          }));
          // Removed: showMessage(`${listType === 'notToDoList' ? 'Item added to Not To Do' : 'Context item added'}!`, 'success');
        } catch (error: unknown) {
          let errorMessage = 'Unknown error';
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          showMessage(`Failed to add item to ${listType}: ${errorMessage}`, 'error');
        }
      } else {
        showMessage(`You must be logged in to add an item to ${listType}.`, 'error');
      }
    },
    [showMessage, currentUser]
  );

  const removeFromList = useCallback(
    async (listType: 'notToDoList' | 'contextItems', id: number) => {
      if (currentUser) {
        try {
          await firebaseService.deleteListItem(currentUser.uid, listType, id);
          setAppState(prev => ({
            ...prev,
            [listType]: prev[listType].filter(item => item.id !== id),
          }));
          // Removed: showMessage(`${listType === 'notToDoList' ? 'Item removed from Not To Do' : 'Context item removed'}!`, 'info');
        } catch (error: unknown) {
          let errorMessage = 'Unknown error';
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          showMessage(`Failed to remove item from ${listType}: ${errorMessage}`, 'error');
        }
      } else {
        showMessage(`You must be logged in to remove an item from ${listType}.`, 'error');
      }
    },
    [showMessage, currentUser]
  );

  // Skeleton Loader for Lists Page
  const ListsSkeletonLoader = () => (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <div className="mb-6 w-1/2 h-8 rounded-md bg-white/10"></div>
        <div className="flex flex-col gap-2 mb-4 sm:flex-row">
          <div className="flex-1 h-12 rounded-lg bg-white/10"></div>
          <div className="w-20 h-12 rounded-lg bg-white/10"></div>
        </div>
        <ul className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <li
              key={i}
              className="flex justify-between items-center p-3 h-14 rounded-md bg-white/5"
            >
              <div className="w-3/4 h-4 rounded-md bg-white/10"></div>
              <div className="w-5 h-5 rounded-full bg-white/10"></div>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <div className="mb-6 w-1/2 h-8 rounded-md bg-white/10"></div>
        <div className="flex flex-col gap-2 mb-4 sm:flex-row">
          <div className="flex-1 h-12 rounded-lg bg-white/10"></div>
          <div className="w-20 h-12 rounded-lg bg-white/10"></div>
        </div>
        <ul className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <li
              key={i}
              className="flex justify-between items-center p-3 h-14 rounded-md bg-white/5"
            >
              <div className="w-3/4 h-4 rounded-md bg-white/10"></div>
              <div className="w-5 h-5 rounded-full bg-white/10"></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  // --- UI Rendering ---
  if (authLoading || dataLoading) {
    return (
      <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
        <div className="container flex-grow p-4 mx-auto max-w-4xl">
          <section className="py-8">
            <ListsSkeletonLoader />
          </section>
        </div>
        <ToastMessage message={toastMessage} type={toastType} duration={5000} />
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="flex justify-center items-center min-h-screen text-white bg-black font-poppins">
        <p className="text-xl text-white/70">Redirecting to login...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <ToastMessage message={toastMessage} type={toastType} duration={5000} />

      <div className="container flex-grow p-4 mx-auto max-w-4xl">
        <section className="py-8">
          <h2 className="mb-8 text-3xl font-bold text-center text-white">Your Focused Lists</h2>
          <div className="flex flex-col gap-6">
            <NotToDoList
              list={appState.notToDoList}
              addToList={(text: string) => addToList('notToDoList', text)}
              removeFromList={(id: number) => removeFromList('notToDoList', id)}
            />
            <ContextList
              list={appState.contextItems}
              addToList={(text: string) => addToList('contextItems', text)}
              removeFromList={(id: number) => removeFromList('contextItems', id)}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
