// app/(root)/todo/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import { firebaseService } from '@/services/firebaseService';
import { AppState, TodoItem } from '@/types';
import ToastMessage from '@/components/ToastMessage';
import TodoList from '@/components/todo/TodoList';
import TodoEditModal from '@/components/todo/TodoEditModal';
import ConfirmationModal from '@/components/ConfirmationModal';

const TodoPageSkeleton = () => (
  <div className="animate-pulse">
    <div className="mx-auto mb-8 w-3/4 h-10 rounded-lg bg-white/10"></div>
    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl shadow-lg">
      <div className="flex flex-col gap-2 mb-6 sm:flex-row">
        <div className="flex-1 h-12 rounded-lg bg-white/10"></div>
        <div className="w-full h-12 rounded-lg sm:w-24 bg-white/10"></div>
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center p-4 h-16 rounded-lg bg-white/5" />
        ))}
      </div>
    </div>
  </div>
);

export default function TodoPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false); // State for Add button loader

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<string | null>(null);
  const [selectedTodoItem, setSelectedTodoItem] = useState<TodoItem | null>(null);

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
  }, []);

  const fetchUserData = useCallback(
    async (uid: string) => {
      try {
        const data = await firebaseService.getUserData(uid);
        setAppState(data);
      } catch {
        showMessage('Failed to load tasks.', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [showMessage]
  );

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      if (user) {
        setCurrentUser(user);
        fetchUserData(user.uid);
      } else {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router, fetchUserData]);

  const handleAddTodo = async (text: string) => {
    if (!currentUser) return;
    setIsAdding(true);
    try {
      await firebaseService.addTodoItem(currentUser.uid, text);
      await fetchUserData(currentUser.uid); // Refetch to get the new list with correct order
      showMessage('Task added!', 'success');
    } catch {
      showMessage('Failed to add task.', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateTodo = async (id: string, updates: Partial<TodoItem>) => {
    if (!currentUser) return;
    try {
      await firebaseService.updateItemInList(currentUser.uid, 'toDoList', id, updates);
      // Optimistic UI update
      setAppState(prev => {
        if (!prev) return null;
        const updatedList = prev.toDoList.map(item =>
          item.id === id ? { ...item, ...updates } : item
        );
        return { ...prev, toDoList: updatedList };
      });
      showMessage(updates.completed ? 'Task completed!' : 'Task updated!', 'success');
    } catch {
      showMessage('Failed to update task.', 'error');
    }
  };

  const handleDeleteConfirmation = async (id: string) => {
    setTodoToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleDeleteTodo = async () => {
    if (!currentUser || !todoToDelete) return;
    try {
      await firebaseService.removeItemFromList(currentUser.uid, 'toDoList', todoToDelete);
      setAppState(prev =>
        prev ? { ...prev, toDoList: prev.toDoList.filter(item => item.id !== todoToDelete) } : null
      );
      showMessage('Task deleted.', 'info');
    } catch {
      showMessage('Failed to delete task.', 'error');
    } finally {
      setIsConfirmModalOpen(false);
      setTodoToDelete(null);
    }
  };

  const handleReorderTodos = async (reorderedList: TodoItem[]) => {
    if (!currentUser) return;
    try {
      // Optimistic update
      setAppState(prev => (prev ? { ...prev, toDoList: reorderedList } : null));
      await firebaseService.updateTodoListOrder(currentUser.uid, reorderedList);
    } catch {
      showMessage('Failed to reorder tasks.', 'error');
      await fetchUserData(currentUser.uid); // Re-fetch on error to correct UI
    }
  };

  const handleOpenEditModal = (item: TodoItem) => {
    setSelectedTodoItem(item);
    setIsEditModalOpen(true);
  };

  const sortedToDoList = appState?.toDoList
    ? [...appState.toDoList].sort((a, b) => a.order - b.order)
    : [];

  if (isLoading) {
    return (
      <main className="container p-4 mx-auto max-w-4xl">
        <section className="py-8">
          <TodoPageSkeleton />
        </section>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen text-white bg-black">
      <ToastMessage message={toastMessage} type={toastType} duration={3000} />
      <div className="container flex-grow p-4 mx-auto max-w-4xl">
        <section className="py-8">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Actionable Tasks</h2>
            <p className="mx-auto max-w-2xl text-lg text-white/70">
              The steps to your goal. Drag to prioritize, add details, and conquer your objective.
            </p>
          </div>

          <TodoList
            toDoList={sortedToDoList}
            onAddTodo={handleAddTodo}
            onUpdateTodo={handleUpdateTodo}
            onDeleteTodo={handleDeleteConfirmation}
            onReorderTodos={handleReorderTodos}
            onEditTodo={handleOpenEditModal}
            showMessage={showMessage}
            isAdding={isAdding}
          />
        </section>
      </div>

      {isEditModalOpen && (
        <TodoEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          todoItem={selectedTodoItem}
          onSave={handleUpdateTodo}
          showMessage={showMessage}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Delete Task?"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmButton={{
          text: 'Delete',
          onClick: handleDeleteTodo,
          className: 'bg-red-600 text-white hover:bg-red-700',
        }}
        cancelButton={{ text: 'Cancel', onClick: () => setIsConfirmModalOpen(false) }}
      />
    </main>
  );
}
