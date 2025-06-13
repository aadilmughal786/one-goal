// app/(root)/todo/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

import { firebaseService } from '@/services/firebaseService';
import { TodoItem } from '@/types';

import { FiCheck, FiTrash2, FiEdit, FiPlus, FiSave } from 'react-icons/fi';
import ToastMessage from '@/components/ToastMessage';

const TodoSkeletonLoader = () => (
  <div className="animate-pulse">
    <div className="mx-auto mb-8 w-3/4 h-10 rounded-lg bg-white/10"></div>
    <div className="mx-auto mb-4 w-full h-8 rounded-lg bg-white/10"></div>
    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl shadow-lg">
      <div className="flex flex-col gap-2 mb-6 sm:flex-row">
        <div className="flex-1 h-12 rounded-lg bg-white/10"></div>
        <div className="w-full h-12 rounded-lg sm:w-24 bg-white/10"></div>
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center p-4 h-16 rounded-lg bg-white/5">
            <div className="mr-4 w-6 h-6 rounded-md bg-white/10"></div>
            <div className="w-3/4 h-4 rounded-md bg-white/10"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function TodoPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [toDoList, setToDoList] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [newTodoText, setNewTodoText] = useState('');
  const [editText, setEditText] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  }, []);

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      if (user) {
        setCurrentUser(user);
        firebaseService.getUserData(user.uid).then(data => {
          setToDoList(
            data.toDoList.sort((a, b) => b.startDate.toMillis() - a.startDate.toMillis()) || []
          );
          setIsLoading(false);
        });
      } else {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleAddTodo = useCallback(async () => {
    if (!newTodoText.trim()) {
      showMessage('Task cannot be empty.', 'error');
      return;
    }
    if (!currentUser) return;

    const newItem: TodoItem = {
      id: Date.now(),
      text: newTodoText.trim(),
      completed: false,
      startDate: Timestamp.now(),
    };

    setToDoList(prev => [newItem, ...prev]);
    setNewTodoText('');
    await firebaseService.addItemToList(currentUser.uid, 'toDoList', newItem);
  }, [newTodoText, currentUser, showMessage]);

  const handleToggleComplete = useCallback(
    async (id: number, completed: boolean) => {
      if (!currentUser) return;
      setToDoList(prev => prev.map(item => (item.id === id ? { ...item, completed } : item)));
      await firebaseService.updateItemInList(currentUser.uid, 'toDoList', id, { completed });
    },
    [currentUser]
  );

  const handleDeleteItem = useCallback(
    async (id: number) => {
      if (!currentUser) return;
      setToDoList(prev => prev.filter(item => item.id !== id));
      await firebaseService.removeItemFromList(currentUser.uid, 'toDoList', id);
    },
    [currentUser]
  );

  const handleStartEditing = (item: TodoItem) => {
    setEditingItemId(item.id);
    setEditText(item.text);
  };

  const handleCancelEditing = () => {
    setEditingItemId(null);
    setEditText('');
  };

  const handleUpdateItem = useCallback(
    async (id: number) => {
      if (!editText.trim()) {
        showMessage('Task cannot be empty.', 'error');
        return;
      }
      if (!currentUser) return;

      setToDoList(prev =>
        prev.map(item => (item.id === id ? { ...item, text: editText.trim() } : item))
      );
      await firebaseService.updateItemInList(currentUser.uid, 'toDoList', id, {
        text: editText.trim(),
      });
      handleCancelEditing();
    },
    [editText, currentUser, showMessage]
  );

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
        <div className="container flex-grow p-4 mx-auto max-w-4xl">
          <section className="py-8">
            <TodoSkeletonLoader />
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <ToastMessage message={toastMessage} type={toastType} />
      <div className="container flex-grow p-4 mx-auto max-w-4xl">
        <section className="py-8">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Actionable Tasks</h2>
            <p className="mx-auto max-w-2xl text-lg text-white/70">
              Your goal is the destination, but these tasks are the steps that get you there. Break
              down your objective into a clear, manageable to-do list.
            </p>
          </div>

          <div className="p-8 mb-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300">
            <div className="flex flex-col gap-2 mb-6 sm:flex-row">
              <input
                type="text"
                value={newTodoText}
                onChange={e => setNewTodoText(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddTodo()}
                placeholder="Add a new task..."
                className="flex-1 p-3 text-lg text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <button
                onClick={handleAddTodo}
                className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/90 hover:scale-105 active:scale-95"
              >
                <FiPlus />
                <span>Add</span>
              </button>
            </div>

            <ul className="space-y-3">
              {toDoList.length === 0 ? (
                <div className="flex flex-col gap-3 items-center p-8 text-center text-white/40">
                  <FiCheck size={40} />
                  <p className="text-lg">Your task list is empty.</p>
                  <p>Add a task above to get started!</p>
                </div>
              ) : (
                toDoList.map(item => (
                  <li
                    key={item.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-all duration-300 ${item.completed ? 'bg-green-500/10 border-transparent' : 'bg-white/[0.03] border-white/10'}`}
                  >
                    <div className="flex flex-grow items-center mb-2 sm:mb-0">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={e => handleToggleComplete(item.id, e.target.checked)}
                          className="sr-only"
                        />
                        <span
                          className={`flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all duration-300 ${item.completed ? 'bg-green-500 border-green-500' : 'border-white/30 group-hover:border-white/50'}`}
                        >
                          {item.completed && <FiCheck className="w-4 h-4 text-white" />}
                        </span>
                      </label>

                      {editingItemId === item.id ? (
                        <input
                          type="text"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyPress={e => e.key === 'Enter' && handleUpdateItem(item.id)}
                          onBlur={handleCancelEditing}
                          autoFocus
                          className="flex-1 ml-4 text-lg text-white bg-transparent border-b outline-none border-white/20"
                        />
                      ) : (
                        <span
                          className={`ml-4 text-lg ${item.completed ? 'line-through text-white/50' : 'text-white'}`}
                        >
                          {item.text}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 items-center self-end sm:self-center">
                      <span className="text-xs text-white/40">{formatDate(item.startDate)}</span>
                      {editingItemId === item.id ? (
                        <button
                          onClick={() => handleUpdateItem(item.id)}
                          className="p-2 text-green-400 rounded-full transition-colors cursor-pointer hover:bg-green-500/10"
                          aria-label="Save changes"
                        >
                          <FiSave />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartEditing(item)}
                          className="p-2 rounded-full transition-colors cursor-pointer text-white/60 hover:text-white hover:bg-white/10"
                          aria-label="Edit item"
                        >
                          <FiEdit />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 rounded-full transition-colors cursor-pointer text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                        aria-label="Delete item"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
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
