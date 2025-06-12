// app/todo/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// Import types
import { AppState, TodoItem, AppMode } from '@/types';

// Import Firebase service functions
import { firebaseService } from '@/services/firebaseService';

// Import Local Storage service functions
import { localStorageService } from '@/services/localStorageService';

// Component imports
import ToastMessage from '@/components/ToastMessage';

// Initial state for the persistent data, specifically for the to-do list
const initialPersistentAppState: AppState = {
  goal: null, // Placeholder, as goal is managed on dashboard
  notToDoList: [], // Placeholder
  contextItems: [], // Placeholder
  toDoList: [], // This page focuses on this list
};

export default function TodoPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [appMode, setAppMode] = useState<AppMode>(localStorageService.getAppModeFromLocalStorage());

  // App state for all persistent data, but this page primarily interacts with toDoList
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

  // --- Data Persistence Logic (saving AppState based on changes to toDoList) ---
  useEffect(() => {
    // Only save if initial loading is complete AND appMode is established (not 'none')
    if (!authLoading && !dataLoading && appMode !== 'none') {
      const dataToSave: AppState = appState; // appState already conforms to AppState type

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
    appState.toDoList,
    appState.goal,
    appState.notToDoList,
    appState.contextItems,
    currentUser,
    appMode,
    authLoading,
    dataLoading,
    showMessage,
    appState,
  ]);

  // --- To-Do List Management Functions ---
  const addTodoItem = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        showMessage('Please enter a To-Do item!', 'error');
        return;
      }
      const newItem: TodoItem = { text, id: Date.now(), completed: false };

      if (appMode === 'google' && currentUser) {
        try {
          await firebaseService.addListItem(currentUser.uid, 'toDoList', newItem);
          setAppState(prev => ({
            ...prev,
            toDoList: [...prev.toDoList, newItem],
          }));
          showMessage('To-Do item added!', 'success');
        } catch (error: any) {
          showMessage(`Failed to add To-Do item: ${error.message || 'Unknown error'}`, 'error');
        }
      } else if (appMode === 'guest') {
        setAppState(prev => ({
          ...prev,
          toDoList: [...prev.toDoList, newItem],
        }));
        showMessage('To-Do item added!', 'success');
      }
    },
    [showMessage, appMode, currentUser]
  );

  const removeTodoItem = useCallback(
    async (id: number) => {
      if (appMode === 'google' && currentUser) {
        try {
          await firebaseService.deleteListItem(currentUser.uid, 'toDoList', id);
          setAppState(prev => ({
            ...prev,
            toDoList: prev.toDoList.filter(item => item.id !== id),
          }));
          showMessage('To-Do item removed!', 'info');
        } catch (error: any) {
          showMessage(`Failed to remove To-Do item: ${error.message || 'Unknown error'}`, 'error');
        }
      } else if (appMode === 'guest') {
        setAppState(prev => ({
          ...prev,
          toDoList: prev.toDoList.filter(item => item.id !== id),
        }));
        showMessage('To-Do item removed!', 'info');
      }
    },
    [showMessage, appMode, currentUser]
  );

  const toggleTodoItemCompletion = useCallback(
    async (id: number, completed: boolean) => {
      if (appMode === 'google' && currentUser) {
        try {
          await firebaseService.toggleTodoItemCompletion(currentUser.uid, id, completed);
          setAppState(prev => ({
            ...prev,
            toDoList: prev.toDoList.map(item =>
              item.id === id ? { ...item, completed: completed } : item
            ),
          }));
          showMessage('To-Do item updated!', 'success');
        } catch (error: any) {
          showMessage(`Failed to update To-Do item: ${error.message || 'Unknown error'}`, 'error');
        }
      } else if (appMode === 'guest') {
        setAppState(prev => ({
          ...prev,
          toDoList: prev.toDoList.map(item =>
            item.id === id ? { ...item, completed: completed } : item
          ),
        }));
        showMessage('To-Do item updated!', 'success');
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
      <ToastMessage message={toastMessage} type={toastType} duration={5000} />

      <div className="container flex-grow p-4 mx-auto max-w-4xl">
        <section className="py-8">
          <div className="p-8 mb-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300">
            <h2 className="mb-6 text-3xl font-bold text-center text-white">Your To-Do List</h2>

            <div className="flex gap-2 mb-4">
              <input
                id="todoInput"
                type="text"
                placeholder="Add a new to-do item..."
                className="flex-1 p-3 text-lg text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    addTodoItem((e.target as HTMLInputElement).value.trim());
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <button
                className="px-6 py-3 text-white bg-blue-600 rounded-md transition-all duration-200 hover:bg-blue-700"
                onClick={() => {
                  const input = document.getElementById('todoInput') as HTMLInputElement;
                  if (input) {
                    addTodoItem(input.value.trim());
                    input.value = '';
                  }
                }}
              >
                Add
              </button>
            </div>

            <ul className="space-y-3">
              {appState.toDoList.length === 0 ? (
                <li className="p-4 text-center rounded-md text-white/70 bg-white/5">
                  No to-do items yet. Start by adding one!
                </li>
              ) : (
                appState.toDoList.map(item => (
                  <li
                    key={item.id}
                    className="flex justify-between items-center p-4 rounded-md border transition-all duration-200 bg-white/5 border-white/10 hover:bg-white/10"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={e => toggleTodoItemCompletion(item.id, e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded cursor-pointer form-checkbox border-white/30 bg-black/20 focus:ring-blue-500"
                      />
                      <span
                        className={`ml-3 text-lg ${item.completed ? 'line-through text-white/50' : 'text-white'}`}
                      >
                        {item.text}
                      </span>
                    </div>
                    <button
                      onClick={() => removeTodoItem(item.id)}
                      className="p-2 text-red-400 rounded-full transition-colors duration-200 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
