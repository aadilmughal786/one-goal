// app/(root)/todo/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { FiList, FiShuffle } from 'react-icons/fi';
import { MdStickyNote2, MdWarning } from 'react-icons/md';

import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import PageContentSkeleton from '@/components/common/PageContentSkeleton';
import DistractionEditModal from '@/components/todo/DistractionEditModal';
import DistractionList from '@/components/todo/DistractionList';
import RandomPicker from '@/components/todo/RandomPicker';
import StickyNotes from '@/components/todo/StickyNotes';
import TodoEditModal from '@/components/todo/TodoEditModal';
import TodoList from '@/components/todo/TodoList';
import { useAuth } from '@/hooks/useAuth';
import { useDistractionStore } from '@/store/useDistractionStore';
import { useGoalStore } from '@/store/useGoalStore';
import { useTodoStore } from '@/store/useTodoStore';
import { DistractionItem, TodoItem } from '@/types';

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
  { id: 'picker', label: 'Random Picker', icon: <FiShuffle size={18} />, component: RandomPicker },
];

const TodoPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading } = useAuth();
  const { appState } = useGoalStore();
  const { updateTodo } = useTodoStore();
  const { updateDistraction } = useDistractionStore();

  const [isTabContentLoading, setIsTabContentLoading] = useState(false);
  const [activeTab, setActiveTabInternal] = useState<string>(tabItems[0].id);
  const [isTodoEditModalOpen, setIsTodoEditModalOpen] = useState(false);
  const [selectedTodoForEdit, setSelectedTodoForEdit] = useState<TodoItem | null>(null);

  const [isDistractionEditModalOpen, setIsDistractionEditModalOpen] = useState(false);
  const [selectedDistractionForEdit, setSelectedDistractionForEdit] =
    useState<DistractionItem | null>(null);

  const todoInputRef = useRef<HTMLInputElement>(null);
  const distractionInputRef = useRef<HTMLInputElement>(null);
  const stickyNoteTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const targetTab = tabItems.find(item => item.id === tabFromUrl)?.id || tabItems[0].id;
    setActiveTabInternal(targetTab);

    const action = searchParams.get('action');
    if (action) {
      if (targetTab === 'todo' && action === 'newTask') {
        setTimeout(() => todoInputRef.current?.focus(), 100);
      } else if (targetTab === 'distractions' && action === 'newDistraction') {
        setTimeout(() => distractionInputRef.current?.focus(), 100);
      } else if (targetTab === 'notes' && action === 'newNote') {
        setTimeout(() => stickyNoteTriggerRef.current?.click(), 100);
      }
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('action');
      window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
    }
  }, [searchParams]);

  const activeGoal = appState?.goals[appState.activeGoalId || ''];

  useEffect(() => {
    if (!isLoading) {
      setIsTabContentLoading(true);
      const timer = setTimeout(() => {
        setIsTabContentLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isLoading]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTabInternal(tabId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleOpenTodoEditModal = useCallback((todo: TodoItem) => {
    setSelectedTodoForEdit(todo);
    setIsTodoEditModalOpen(true);
  }, []);

  const handleSaveTodoUpdates = useCallback(
    async (id: string, updates: Partial<TodoItem>) => {
      await updateTodo(id, updates);
    },
    [updateTodo]
  );

  const handleOpenDistractionEditModal = useCallback((distraction: DistractionItem) => {
    setSelectedDistractionForEdit(distraction);
    setIsDistractionEditModalOpen(true);
  }, []);

  const handleSaveDistractionUpdates = useCallback(
    async (id: string, updates: Partial<DistractionItem>) => {
      await updateDistraction(id, updates);
    },
    [updateDistraction]
  );

  const renderActiveTabContent = () => {
    if (isLoading || isTabContentLoading) {
      return <PageContentSkeleton />;
    }

    if (!activeGoal) {
      return <NoActiveGoalMessage />;
    }

    const ActiveComponent = tabItems.find(item => item.id === activeTab)?.component;

    if (ActiveComponent) {
      if (activeTab === 'todo') {
        return <TodoList onEditTodo={handleOpenTodoEditModal} inputRef={todoInputRef} />;
      }
      if (activeTab === 'distractions') {
        return (
          <DistractionList
            onEditDistraction={handleOpenDistractionEditModal}
            inputRef={distractionInputRef}
          />
        );
      }
      if (activeTab === 'notes') {
        return <StickyNotes addNoteButtonRef={stickyNoteTriggerRef} />;
      }
      return <ActiveComponent />;
    }
    return null;
  };

  return (
    <main className="flex flex-col min-h-screen text-text-primary bg-bg-primary font-poppins">
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-bg-primary/50 border-border-primary">
        <div className="flex space-x-2">
          {isLoading
            ? [...Array(tabItems.length)].map((_, i) => (
                <div key={i} className="px-4 py-3 animate-pulse">
                  <div className="w-24 h-6 rounded-md bg-bg-tertiary"></div>
                </div>
              ))
            : tabItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none
                    ${isActive ? 'text-text-primary border-border-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
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
        onSave={handleSaveTodoUpdates}
      />

      <DistractionEditModal
        isOpen={isDistractionEditModalOpen}
        onClose={() => setIsDistractionEditModalOpen(false)}
        distractionItem={selectedDistractionForEdit}
        onSave={handleSaveDistractionUpdates}
      />
    </main>
  );
};

export default function TodoPage() {
  return (
    <Suspense fallback={<PageContentSkeleton />}>
      <TodoPageContent />
    </Suspense>
  );
}
