// app/(root)/todo/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { User } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { IconType } from 'react-icons';
import { FiBookOpen, FiCheckSquare } from 'react-icons/fi';
import { RiAlarmWarningLine } from 'react-icons/ri';

import { firebaseService } from '@/services/firebaseService';
import { ListItem, TodoItem, AppState, DistractionItem } from '@/types';
import ListComponent from '@/components/List';
import TodoList from '@/components/todo/TodoList';
import TodoEditModal from '@/components/todo/TodoEditModal';
import ToastMessage from '@/components/ToastMessage';
import ConfirmationModal from '@/components/ConfirmationModal';

const ListsPageSkeletonLoader = () => (
  <div className="space-y-8 animate-pulse">
    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl shadow-lg">
      <div className="mb-2 w-1/3 h-8 rounded-lg bg-white/10"></div>
      <div className="mb-6 w-full h-4 rounded-lg bg-white/10"></div>
      <div className="space-y-3">
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
      </div>
    </div>
  </div>
);

interface TabItem {
  id: string;
  label: string;
  icon: IconType;
}

const tabItems: TabItem[] = [
  { id: 'todo', label: 'To-Do List', icon: FiCheckSquare },
  { id: 'not-to-do', label: 'What Not To Do', icon: RiAlarmWarningLine },
  { id: 'notes', label: 'Contextual Notes', icon: FiBookOpen },
];

const ConsolidatedListPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setAppState] = useState<AppState | null>(null);

  // States for all lists
  const [toDoList, setToDoList] = useState<TodoItem[]>([]);
  const [notToDoList, setNotToDoList] = useState<DistractionItem[]>([]);
  const [contextList, setContextList] = useState<ListItem[]>([]);

  // States for UI feedback and modals
  const [isAdding, setIsAdding] = useState({ todo: false, notToDoList: false, contextList: false });
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    listType: 'toDoList' | 'notToDoList' | 'contextList';
    id: string;
  } | null>(null);

  // States for editing
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [selectedTodoItem, setSelectedTodoItem] = useState<TodoItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // General UI states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabItems.find(item => item.id === tabFromUrl)?.id || tabItems[0].id;
  });

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
  }, []);

  const fetchUserData = useCallback(
    async (uid: string) => {
      try {
        const data = await firebaseService.getUserData(uid);
        setAppState(data);
        setToDoList(data.toDoList || []);
        setNotToDoList(data.notToDoList || []);
        setContextList(data.contextList || []);
      } catch {
        showMessage('Failed to load lists.', 'error');
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

  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTabInternal(tabId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && activeTab !== tabFromUrl) {
      if (tabItems.some(item => item.id === tabFromUrl)) {
        setActiveTabInternal(tabFromUrl);
      }
    }
  }, [searchParams, activeTab]);

  // --- Handlers for all list types ---

  const handleAddToList = useCallback(
    async (listType: 'notToDoList' | 'contextList', text: string) => {
      if (!text.trim()) {
        showMessage('Item cannot be empty.', 'error');
        return;
      }
      if (!currentUser) return;
      setIsAdding(prev => ({ ...prev, [listType]: true }));
      try {
        await firebaseService.addItemToList(currentUser.uid, listType, text.trim());
        await fetchUserData(currentUser.uid);
        showMessage('Item added!', 'success');
      } catch {
        showMessage('Failed to add item.', 'error');
      } finally {
        setIsAdding(prev => ({ ...prev, [listType]: false }));
      }
    },
    [currentUser, fetchUserData, showMessage]
  );

  const handleAddTodo = async (text: string) => {
    if (!currentUser) return;
    setIsAdding(prev => ({ ...prev, todo: true }));
    try {
      await firebaseService.addTodoItem(currentUser.uid, text);
      await fetchUserData(currentUser.uid);
      showMessage('Task added!', 'success');
    } catch {
      showMessage('Failed to add task.', 'error');
    } finally {
      setIsAdding(prev => ({ ...prev, todo: false }));
    }
  };

  const handleUpdateItem = useCallback(
    async (
      listType: 'toDoList' | 'notToDoList' | 'contextList',
      id: string,
      updates: Partial<TodoItem | DistractionItem>
    ) => {
      if (!currentUser) return;
      setIsUpdatingId(id);
      try {
        await firebaseService.updateItemInList(currentUser.uid, listType, id, updates);
        await fetchUserData(currentUser.uid); // Refetch for consistency
        if ('completed' in updates && updates.completed !== undefined) {
          showMessage(updates.completed ? 'Task completed!' : 'Task updated!', 'success');
        } else if ('count' in updates) {
          // No message for quick counter updates to avoid spam
        } else {
          showMessage('Item updated.', 'success');
        }
      } catch {
        showMessage('Failed to update item.', 'error');
      } finally {
        setIsUpdatingId(null);
        setEditingItemId(null);
        setIsEditModalOpen(false);
      }
    },
    [currentUser, fetchUserData, showMessage]
  );

  const handleDeleteConfirmation = (
    listType: 'toDoList' | 'notToDoList' | 'contextList',
    id: string
  ) => {
    setItemToDelete({ listType, id });
    setIsConfirmModalOpen(true);
  };

  const removeFromList = useCallback(async () => {
    if (!currentUser || !itemToDelete) return;
    const { listType, id } = itemToDelete;
    try {
      await firebaseService.removeItemFromList(currentUser.uid, listType, id);
      await fetchUserData(currentUser.uid);
      showMessage('Item removed.', 'info');
    } catch {
      showMessage('Failed to remove item.', 'error');
    } finally {
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
    }
  }, [currentUser, showMessage, itemToDelete, fetchUserData]);

  const handleReorderTodos = async (reorderedList: TodoItem[]) => {
    if (!currentUser) return;
    try {
      setToDoList(reorderedList); // Optimistic update
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

  const sortedToDoList = [...toDoList].sort((a, b) => a.order - b.order);

  const renderActiveTabContent = () => {
    if (isLoading) {
      return <ListsPageSkeletonLoader />;
    }

    switch (activeTab) {
      case 'todo':
        return (
          <TodoList
            toDoList={sortedToDoList}
            onAddTodo={handleAddTodo}
            onUpdateTodo={(id, updates) => handleUpdateItem('toDoList', id, updates)}
            onDeleteTodo={async id => handleDeleteConfirmation('toDoList', id)}
            onReorderTodos={handleReorderTodos}
            onEditTodo={handleOpenEditModal}
            showMessage={showMessage}
            isAdding={isAdding.todo}
          />
        );
      case 'not-to-do':
        return (
          <ListComponent
            list={notToDoList}
            addToList={text => handleAddToList('notToDoList', text)}
            removeFromList={id => handleDeleteConfirmation('notToDoList', id)}
            updateItem={(id, updates) => handleUpdateItem('notToDoList', id, updates)}
            placeholder="Add a distraction to avoid..."
            themeColor="red"
            editingItemId={editingItemId}
            setEditingItemId={setEditingItemId}
            editText={editText}
            setEditText={setEditText}
            isAdding={isAdding.notToDoList}
            isUpdatingId={isUpdatingId}
          />
        );
      case 'notes':
        return (
          <ListComponent
            list={contextList}
            addToList={text => handleAddToList('contextList', text)}
            removeFromList={id => handleDeleteConfirmation('contextList', id)}
            updateItem={(id, updates) => handleUpdateItem('contextList', id, updates)}
            placeholder="Add a note or learning..."
            themeColor="blue"
            editingItemId={editingItemId}
            setEditingItemId={setEditingItemId}
            editText={editText}
            setEditText={setEditText}
            isAdding={isAdding.contextList}
            isUpdatingId={isUpdatingId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex flex-col min-h-screen text-white bg-black">
      <ToastMessage message={toastMessage} type={toastType} />

      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex flex-wrap justify-center space-x-2">
          {tabItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none
                    ${isActive ? 'text-white border-blue-500' : 'border-transparent text-white/60 hover:text-white'}`}
                aria-label={item.label}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="container flex-grow p-4 mx-auto max-w-4xl">
        <section className="py-8">{renderActiveTabContent()}</section>
      </div>

      {isEditModalOpen && (
        <TodoEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          todoItem={selectedTodoItem}
          onSave={(id, updates) => handleUpdateItem('toDoList', id, updates)}
          showMessage={showMessage}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Delete Item?"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmButton={{
          text: 'Delete',
          onClick: removeFromList,
          className: 'bg-red-600 text-white hover:bg-red-700',
        }}
        cancelButton={{ text: 'Cancel', onClick: () => setIsConfirmModalOpen(false) }}
      />
    </main>
  );
};

export default function TodoPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConsolidatedListPageContent />
    </Suspense>
  );
}
