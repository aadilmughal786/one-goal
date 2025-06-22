// app/(root)/todo/page.tsx
'use client';

import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { FiList } from 'react-icons/fi';
import { MdStickyNote2, MdWarning } from 'react-icons/md';

import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import TodoEditModal from '@/components/todo/TodoEditModal';
import { AppState, DistractionItem, TodoItem } from '@/types';

import { onAuthChange } from '@/services/authService';

import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';

import DistractionList from '@/components/todo/DistractionList';
import StickyNotes from '@/components/todo/StickyNotes';
import TodoList from '@/components/todo/TodoList';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

const tabItems: TabItem[] = [
  { id: 'todo', label: 'My Tasks', icon: <FiList size={18} />, component: TodoList },
  {
    id: 'distractions',
    label: 'What Not To Do',
    icon: <MdWarning size={18} />,
    component: DistractionList,
  },
  { id: 'notes', label: 'Sticky Notes', icon: <MdStickyNote2 size={18} />, component: StickyNotes },
];

const TodoPageSkeletonLoader = () => (
  <div className="space-y-8 animate-pulse">
    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl shadow-lg">
      <div className="mb-2 w-1/3 h-8 rounded-lg bg-white/10"></div>
      <div className="mb-6 w-full h-4 rounded-lg bg-white/10"></div>
      <div className="space-y-3">
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
      </div>
    </div>
  </div>
);

const TodoPageContent = () => {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  // NEW: isTabContentLoading for when switching between internal tabs.
  const [isTabContentLoading, setIsTabContentLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const showToast = useNotificationStore(state => state.showToast);

  const activeGoalId = useGoalStore(state => state.appState?.activeGoalId);
  const activeGoal = useGoalStore(state =>
    state.appState?.activeGoalId ? state.appState.goals[state.appState.activeGoalId] : null
  );
  const fetchInitialData = useGoalStore(state => state.fetchInitialData);
  const addTodoAction = useGoalStore(state => state.addTodo);
  const updateTodoAction = useGoalStore(state => state.updateTodo);
  const deleteTodoAction = useGoalStore(state => state.deleteTodo);
  const reorderTodosAction = useGoalStore(state => state.reorderTodos);
  const addDistractionAction = useGoalStore(state => state.addDistraction);
  const updateDistractionAction = useGoalStore(state => state.updateDistraction);
  const deleteDistractionAction = useGoalStore(state => state.deleteDistraction);

  const [activeTab, setActiveTab] = useState('todo');
  const [isTodoEditModalOpen, setIsTodoEditModalOpen] = useState(false);
  const [selectedTodoForEdit, setSelectedTodoForEdit] = useState<TodoItem | null>(null);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [isAddingDistraction, setIsAddingDistraction] = useState(false);

  // Effect for initial page load and authentication
  useEffect(() => {
    const unsubscribe = onAuthChange(async user => {
      if (user) {
        setCurrentUser(user);
        await fetchInitialData(user);
        setAppState(useGoalStore.getState().appState);
        setIsLoading(false); // Once initial data is fetched, set main loading to false
      } else {
        router.replace('/login');
      }
    });

    const initialLoadTimeout = setTimeout(() => {
      if (isLoading && currentUser === undefined && appState === undefined) {
        setIsLoading(false); // Fallback for very slow/failed initial auth
      }
    }, 2000); // Increased timeout for robustness

    return () => {
      unsubscribe();
      clearTimeout(initialLoadTimeout);
    };
  }, [router, fetchInitialData, isLoading, currentUser, appState]); // Added dependencies

  // Effect to manage 'isTabContentLoading' when the activeTab changes
  useEffect(() => {
    // Only trigger this effect if the main page has finished its initial loading
    if (!isLoading) {
      setIsTabContentLoading(true); // Immediately set loading to true for the new tab content
      const timer = setTimeout(() => {
        setIsTabContentLoading(false); // Reset loading state after a short delay
      }, 300); // Simulate a brief loading period (adjust as needed)

      return () => clearTimeout(timer); // Cleanup timer on unmount or tab change
    }
  }, [activeTab, isLoading]); // Trigger when activeTab changes, but only if main isLoading is false

  const handleAddTodo = useCallback(
    async (text: string) => {
      if (!currentUser || !activeGoalId) {
        showToast('Please select an active goal to add tasks.', 'error');
        return;
      }
      setIsAddingTodo(true);
      try {
        await addTodoAction(text);
        showToast('Task added successfully!', 'success');
      } catch {
        showToast('Failed to add task.', 'error');
      } finally {
        setIsAddingTodo(false);
      }
    },
    [currentUser, activeGoalId, showToast, addTodoAction]
  );

  const handleUpdateTodo = useCallback(
    async (id: string, updates: Partial<TodoItem>) => {
      if (!currentUser || !activeGoalId) {
        showToast('Authentication or active goal required to update tasks.', 'error');
        return;
      }
      try {
        await updateTodoAction(id, updates);
        showToast('Task updated!', 'success');
      } catch {
        showToast('Failed to update task.', 'error');
      }
    },
    [currentUser, activeGoalId, showToast, updateTodoAction]
  );

  const handleDeleteTodo = useCallback(
    async (id: string) => {
      if (!currentUser || !activeGoalId) {
        showToast('Authentication or active goal required to delete tasks.', 'error');
        return;
      }
      try {
        await deleteTodoAction(id);
        showToast('Task deleted.', 'info');
      } catch {
        showToast('Failed to delete task.', 'error');
      }
    },
    [currentUser, activeGoalId, showToast, deleteTodoAction]
  );

  const handleReorderTodos = useCallback(
    async (reorderedList: TodoItem[]) => {
      if (!currentUser || !activeGoalId) return;
      try {
        await reorderTodosAction(reorderedList);
        showToast('Tasks reordered!', 'success');
      } catch {
        showToast('Failed to reorder tasks.', 'error');
      }
    },
    [currentUser, activeGoalId, showToast, reorderTodosAction]
  );

  const handleOpenTodoEditModal = useCallback((todo: TodoItem) => {
    setSelectedTodoForEdit(todo);
    setIsTodoEditModalOpen(true);
  }, []);

  const handleAddDistraction = useCallback(
    async (title: string) => {
      if (!currentUser || !activeGoalId) {
        showToast('Please select an active goal to add distractions.', 'error');
        return;
      }
      setIsAddingDistraction(true);
      try {
        await addDistractionAction(title);
        showToast('Distraction added!', 'success');
      } catch {
        showToast('Failed to add distraction.', 'error');
      } finally {
        setIsAddingDistraction(false);
      }
    },
    [currentUser, activeGoalId, showToast, addDistractionAction]
  );

  const handleUpdateDistraction = useCallback(
    async (id: string, updates: Partial<DistractionItem>) => {
      if (!currentUser || !activeGoalId) {
        showToast('Authentication or active goal required to update distractions.', 'error');
        return;
      }
      try {
        await updateDistractionAction(id, updates);
        showToast('Distraction updated!', 'success');
      } catch {
        showToast('Failed to update distraction.', 'error');
      }
    },
    [currentUser, activeGoalId, showToast, updateDistractionAction]
  );

  const handleDeleteDistraction = useCallback(
    async (id: string) => {
      if (!currentUser || !activeGoalId) {
        showToast('Authentication or active goal required to delete distractions.', 'error');
        return;
      }
      try {
        await deleteDistractionAction(id);
        showToast('Distraction deleted.', 'info');
      } catch {
        showToast('Failed to delete distraction.', 'error');
      }
    },
    [currentUser, activeGoalId, showToast, deleteDistractionAction]
  );

  const toDoList = useMemo(
    () => (activeGoal?.toDoList || []).sort((a, b) => a.order - b.order),
    [activeGoal?.toDoList]
  );
  const notToDoList = useMemo(() => activeGoal?.notToDoList || [], [activeGoal?.notToDoList]);
  const stickyNotes = useMemo(() => activeGoal?.stickyNotes || [], [activeGoal?.stickyNotes]);

  const renderActiveTabContent = () => {
    // Show initial full page loader (for the entire page content)
    if (isLoading) {
      return <TodoPageSkeletonLoader />;
    }

    // Show tab content loader ONLY when switching tabs (after initial page load)
    if (isTabContentLoading) {
      return <TodoPageSkeletonLoader />;
    }

    if (!activeGoal) {
      return <NoActiveGoalMessage />;
    }

    const ActiveComponent = tabItems.find(item => item.id === activeTab)?.component;

    if (ActiveComponent) {
      const commonProps = {
        currentUser,
        appState,
      };

      switch (activeTab) {
        case 'todo':
          return (
            <TodoList
              {...commonProps}
              toDoList={toDoList}
              onAddTodo={handleAddTodo}
              onUpdateTodo={handleUpdateTodo}
              onDeleteTodo={handleDeleteTodo}
              onReorderTodos={handleReorderTodos}
              onEditTodo={handleOpenTodoEditModal}
              isAdding={isAddingTodo}
            />
          );
        case 'distractions':
          return (
            <DistractionList
              {...commonProps}
              list={notToDoList}
              addToList={handleAddDistraction}
              removeFromList={handleDeleteDistraction}
              updateItem={handleUpdateDistraction}
              placeholder="Add a distraction"
              editingItemId={null}
              setEditingItemId={() => {}}
              editText={''}
              setEditText={() => {}}
              isAdding={isAddingDistraction}
              isUpdatingId={null}
            />
          );
        case 'notes':
          return <StickyNotes {...commonProps} stickyNotes={stickyNotes} />;
        default:
          return null;
      }
    }
    return null;
  };

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex space-x-2">
          {/* Tabs: Apply skeleton loader only during initial page load (isLoading) */}
          {isLoading
            ? [...Array(tabItems.length)].map((_, i) => (
                <div key={i} className="px-4 py-4 animate-pulse">
                  <div className="w-24 h-6 rounded-md bg-white/10"></div>
                </div>
              ))
            : tabItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none
                    ${isActive ? 'text-white border-blue-500' : 'border-transparent text-white/60 hover:text-white'}`}
                    aria-label={`Switch to ${item.label} tab`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
        </div>
      </nav>
      <div className="container flex-grow p-4 mx-auto max-w-4xl">
        <section className="py-8 w-full">{renderActiveTabContent()}</section>
      </div>

      <TodoEditModal
        isOpen={isTodoEditModalOpen}
        onClose={() => setIsTodoEditModalOpen(false)}
        todoItem={selectedTodoForEdit}
        onSave={handleUpdateTodo}
      />
    </main>
  );
};

export default function TodoPage() {
  return (
    <Suspense fallback={<TodoPageSkeletonLoader />}>
      <TodoPageContent />
    </Suspense>
  );
}
