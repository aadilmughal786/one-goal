// app/(root)/todo/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// Import types
import { AppState, TodoItem } from '@/types';

// Import Firebase service functions
import { firebaseService } from '@/services/firebaseService';

// Component imports
import ToastMessage from '@/components/ToastMessage';
import { FiCheckSquare } from 'react-icons/fi';
import { RiDeleteBin5Fill } from 'react-icons/ri';

// Initial state for the persistent data, specifically for the to-do list
const initialPersistentAppState: AppState = {
  goal: null, // Placeholder, as goal is managed on dashboard
  notToDoList: [], // Placeholder
  contextItems: [], // Placeholder
  toDoList: [], // This page focuses on this list
  dailyProgress: [], // Initialize dailyProgress
};

export default function TodoPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

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

  // --- Initial Data Loading Logic ---
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
            // Removed: showMessage('Firebase data loaded.', 'success'); - UI will show content
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

  // --- Data Persistence Logic (saving AppState based on changes to toDoList) ---
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
    appState.toDoList,
    appState.goal,
    appState.notToDoList,
    appState.contextItems,
    appState.dailyProgress,
    currentUser,
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

      if (currentUser) {
        try {
          await firebaseService.addListItem(currentUser.uid, 'toDoList', newItem);
          setAppState(prev => ({
            ...prev,
            toDoList: [...prev.toDoList, newItem],
          }));
          // Removed: showMessage('To-Do item added!', 'success'); - UI update is enough
        } catch (error: unknown) {
          let errorMessage = 'Unknown error';
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          showMessage(`Failed to add To-Do item: ${errorMessage}`, 'error');
        }
      } else {
        showMessage('You must be logged in to add a To-Do item.', 'error');
      }
    },
    [showMessage, currentUser]
  );

  const removeTodoItem = useCallback(
    async (id: number) => {
      if (currentUser) {
        try {
          await firebaseService.deleteListItem(currentUser.uid, 'toDoList', id);
          setAppState(prev => ({
            ...prev,
            toDoList: prev.toDoList.filter(item => item.id !== id),
          }));
          // Removed: showMessage('To-Do item removed!', 'info'); - UI update is enough
        } catch (error: unknown) {
          let errorMessage = 'Unknown error';
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          showMessage(`Failed to remove To-Do item: ${errorMessage}`, 'error');
        }
      } else {
        showMessage('You must be logged in to remove a To-Do item.', 'error');
      }
    },
    [showMessage, currentUser]
  );

  const toggleTodoItemCompletion = useCallback(
    async (id: number, completed: boolean) => {
      if (currentUser) {
        try {
          await firebaseService.toggleTodoItemCompletion(currentUser.uid, id, completed);
          setAppState(prev => ({
            ...prev,
            toDoList: prev.toDoList.map(item =>
              item.id === id ? { ...item, completed: completed } : item
            ),
          }));
          // Removed: showMessage('To-Do item updated!', 'success'); - UI update is enough
        } catch (error: unknown) {
          let errorMessage = 'Unknown error';
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          showMessage(`Failed to update To-Do item: ${errorMessage}`, 'error');
        }
      } else {
        showMessage('You must be logged in to update a To-Do item.', 'error');
      }
    },
    [showMessage, currentUser]
  );

  // Skeleton Loader for To-Do List
  const TodoSkeletonLoader = () => (
    <div className="animate-pulse p-8 mb-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
      <div className="mx-auto mb-6 w-1/2 h-8 rounded-md bg-white/10"></div>
      <div className="flex flex-col gap-2 mb-4 sm:flex-row">
        <div className="flex-1 h-12 rounded-lg bg-white/10"></div>
        <div className="w-20 h-12 rounded-lg bg-white/10"></div>
      </div>
      <ul className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <li key={i} className="flex justify-between items-center p-4 h-16 rounded-md bg-white/5">
            <div className="flex items-center w-full">
              <div className="mr-3 w-5 h-5 rounded-full bg-white/10"></div>
              <div className="w-3/4 h-4 rounded-md bg-white/10"></div>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/10"></div>
          </li>
        ))}
      </ul>
    </div>
  );

  // --- UI Rendering ---
  if (authLoading || dataLoading) {
    return (
      <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
        <div className="container flex-grow p-4 mx-auto max-w-4xl">
          <section className="py-8">
            <TodoSkeletonLoader />
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
          <div className="p-8 mb-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300">
            <h2 className="mb-6 text-3xl font-bold text-center text-white">Your To-Do List</h2>

            <div className="flex flex-col gap-2 mb-4 sm:flex-row">
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
                className="px-6 py-3 text-white rounded-md transition-all duration-200 cursor-pointer bg-white/5 border-white/10 hover:bg-white/10"
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
                <div className="flex flex-col gap-3 items-center p-4 text-center py-30 text-white/30">
                  <FiCheckSquare size={50} />
                  No to-do items yet. Start by adding one!
                </div>
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
                        className="w-5 h-5 bg-transparent rounded-full border border-white cursor-pointer form-checkbox checked:bg-transparent checked:border-black checked:accent-white"
                      />
                      <span
                        className={`ml-3 text-lg ${item.completed ? 'line-through text-white/50' : 'text-white'}`}
                      >
                        {item.text}
                      </span>
                    </div>
                    <button
                      onClick={() => removeTodoItem(item.id)}
                      className="p-2 text-white rounded-full transition-colors duration-200 cursor-pointer hover:bg-red-400"
                    >
                      <RiDeleteBin5Fill />
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
