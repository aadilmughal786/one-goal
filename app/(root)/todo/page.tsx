// app/(root)/todo/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

import { firebaseService } from '@/services/firebaseService';
import { TodoItem } from '@/types';
import ToastMessage from '@/components/ToastMessage';
import TodoList from '@/components/todo/TodoList';
import TodoEditModal from '@/components/todo/TodoEditModal';

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

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTodoItem, setSelectedTodoItem] = useState<TodoItem | null>(null);

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
          setToDoList(data.toDoList ? [...data.toDoList].sort((a, b) => a.order - b.order) : []);
          setIsLoading(false);
        });
      } else {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleAddTodo = useCallback(
    async (text: string) => {
      if (!currentUser) return;
      try {
        const newItem = await firebaseService.addTodoItem(currentUser.uid, text);
        setToDoList(prev => [...prev, newItem].sort((a, b) => a.order - b.order));
        showMessage('Task added!', 'success');
      } catch (error) {
        showMessage('Failed to add task.', 'error');
        console.error('Error adding todo item:', error);
      }
    },
    [currentUser, showMessage]
  );

  const handleToggleComplete = useCallback(
    async (id: string, completed: boolean) => {
      if (!currentUser) return;
      try {
        // When task is completed, set completedAt to now and deadline to undefined (which becomes null in service)
        // When task is uncompleted, set completedAt to undefined and leave deadline as is.
        await firebaseService.updateItemInList(currentUser.uid, 'toDoList', id, {
          completed: completed,
          completedAt: completed ? Timestamp.now() : undefined,
          deadline: completed ? undefined : toDoList.find(item => item.id === id)?.deadline || null, // Set deadline to null if completed, otherwise keep original.
        });
        setToDoList(prev =>
          prev
            .map(item =>
              item.id === id
                ? {
                    ...item,
                    completed,
                    completedAt: completed ? Timestamp.now() : null,
                    deadline: completed ? null : item.deadline, // Update local state with null if completed
                  }
                : item
            )
            .sort((a, b) => a.order - b.order)
        );
        showMessage(completed ? 'Task completed!' : 'Task uncompleted.', 'success');
      } catch (error) {
        showMessage('Failed to update task status.', 'error');
        console.error('Error toggling todo completion:', error);
      }
    },
    [currentUser, showMessage, toDoList] // Added toDoList to dependencies for current deadline access
  );

  const handleDeleteItem = useCallback(
    async (id: string) => {
      if (!currentUser) return;
      try {
        await firebaseService.removeItemFromList(currentUser.uid, 'toDoList', id);
        setToDoList(prev => prev.filter(item => item.id !== id).sort((a, b) => a.order - b.order));
        showMessage('Task deleted.', 'info');
      } catch (error) {
        showMessage('Failed to delete task.', 'error');
        console.error('Error deleting todo item:', error);
      }
    },
    [currentUser, showMessage]
  );

  const handleUpdateItem = useCallback(
    async (id: string, updates: Partial<TodoItem>) => {
      if (!currentUser) return;
      try {
        await firebaseService.updateItemInList(currentUser.uid, 'toDoList', id, updates);
        setToDoList(prev =>
          prev
            .map(item => (item.id === id ? { ...item, ...updates } : item))
            .sort((a, b) => a.order - b.order)
        );
      } catch (error) {
        showMessage('Failed to update task.', 'error');
        console.error('Error updating todo item:', error);
      }
    },
    [currentUser, showMessage]
  );

  const handleUpdateTodoListOrder = useCallback(
    async (newOrder: TodoItem[]) => {
      if (!currentUser) return;
      try {
        const listToSave = newOrder.map(item => ({
          ...item,
          updatedAt: Timestamp.now(),
        }));
        await firebaseService.updateTodoListOrder(currentUser.uid, listToSave);
        setToDoList(listToSave);
      } catch (error) {
        showMessage('Failed to update task order.', 'error');
        console.error('Error updating todo list order:', error);
      }
    },
    [currentUser, showMessage]
  );

  const handleOpenEditModal = useCallback((item: TodoItem) => {
    setSelectedTodoItem(item);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedTodoItem(null);
  }, []);

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
              Your goal is the destination, but these tasks are the steps that get you there. Drag
              and drop to prioritize your list, and add deadlines/priorities.
            </p>
          </div>

          <TodoList
            toDoList={toDoList}
            onAddTodo={handleAddTodo}
            onToggleComplete={handleToggleComplete}
            onDeleteItem={handleDeleteItem}
            onUpdateTodoListOrder={handleUpdateTodoListOrder}
            onEditTodoItem={handleOpenEditModal}
            showMessage={showMessage}
          />
        </section>
      </div>

      <TodoEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        todoItem={selectedTodoItem}
        onSave={handleUpdateItem}
        showMessage={showMessage}
      />
    </main>
  );
}
