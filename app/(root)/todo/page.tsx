// app/(root)/todo/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { User } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { IconType } from 'react-icons';
import { FiCheckSquare } from 'react-icons/fi';
import { RiAlarmWarningLine } from 'react-icons/ri';
import { MdStickyNote2 } from 'react-icons/md'; // Import for StickyNotes icon
import Link from 'next/link'; // Import Link for navigation to dashboard

import { firebaseService } from '@/services/firebaseService';
import { TodoItem, AppState, DistractionItem, StickyNote } from '@/types'; // Import StickyNote
import DistractionListComponent from '@/components/todo/DistractionList'; // Renamed import to be specific
import TodoList from '@/components/todo/TodoList';
import StickyNotesComponent from '@/components/todo/StickyNotes'; // New import for StickyNotes
import TodoEditModal from '@/components/todo/TodoEditModal';
import ToastMessage from '@/components/common/ToastMessage';
import ConfirmationModal from '@/components/common/ConfirmationModal';

// Skeleton Loader for lists page to show during data fetching
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

// Interface for defining a tab item in the navigation
interface TabItem {
  id: string;
  label: string;
  icon: IconType;
}

// Define the tabs for the page, mapping to list types and icons
const tabItems: TabItem[] = [
  { id: 'todo', label: 'To-Do List', icon: FiCheckSquare },
  { id: 'distractions', label: 'Distractions', icon: RiAlarmWarningLine }, // Renamed tab
  { id: 'sticky-notes', label: 'Sticky Notes', icon: MdStickyNote2 }, // Renamed tab
];

// Main content component for the To-Do/Lists page
const ConsolidatedListPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appState, setAppState] = useState<AppState | null>(null); // Stores the overall AppState

  // States for specific lists, derived from appState
  const [toDoList, setToDoList] = useState<TodoItem[]>([]);
  const [distractionList, setDistractionList] = useState<DistractionItem[]>([]); // Renamed state
  const [, setStickyNotesList] = useState<StickyNote[]>([]); // Renamed state

  // States for UI feedback and modals
  const [isAdding, setIsAdding] = useState({
    todo: false,
    distractions: false, // Updated key for distraction list adding status
    stickyNotes: false, // Updated key for sticky notes adding status (though StickyNotesComponent manages its own)
  });
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null); // For general item updates (e.g., distraction count)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  // Stores info about the item to be deleted (type and ID)
  const [itemToDelete, setItemToDelete] = useState<{
    listType: 'todo' | 'distraction' | 'sticky-note'; // Explicitly define possible list types for deletion
    id: string;
  } | null>(null);

  // States for editing generic list items (like distractions in their specific component)
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  // States for editing Todo items (via dedicated modal)
  const [selectedTodoItem, setSelectedTodoItem] = useState<TodoItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // General UI states for toast messages
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Active tab state, initialized from URL search parameters or defaults to 'todo'
  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabItems.find(item => item.id === tabFromUrl)?.id || tabItems[0].id;
  });

  // Callback to display toast messages
  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000); // Auto-hide toast after 3 seconds
  }, []);

  // Fetches user's entire AppState from Firebase and updates all relevant list states.
  const fetchUserData = useCallback(
    async (uid: string) => {
      try {
        const data = await firebaseService.getUserData(uid);
        setAppState(data); // Set the overall application state

        // Derive specific lists from the active goal's data within AppState
        const activeGoal = data.activeGoalId ? data.goals[data.activeGoalId] : null;
        setToDoList(activeGoal?.toDoList || []);
        setDistractionList(activeGoal?.notToDoList || []); // Set distraction list from 'notToDoList'
        setStickyNotesList(activeGoal?.stickyNotes || []); // Set sticky notes list from 'stickyNotes'
      } catch (error) {
        console.error('Failed to load lists:', error);
        showMessage('Failed to load lists.', 'error');
      } finally {
        setIsLoading(false); // Set loading to false regardless of success or failure
      }
    },
    [showMessage]
  );

  // Effect to handle user authentication state changes and initial data fetching.
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      if (user) {
        setCurrentUser(user);
        fetchUserData(user.uid); // Fetch user data when authenticated
      } else {
        router.replace('/login'); // Redirect to login page if not authenticated
      }
    });
    return () => unsubscribe(); // Cleanup the Firebase auth listener
  }, [router, fetchUserData]); // Dependencies: router and fetchUserData

  // Handles changing the active tab and updates the URL search parameters accordingly.
  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTabInternal(tabId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false }); // Update URL without full reload
    },
    [router, searchParams]
  );

  // Effect to synchronize the active tab state with the URL search parameters on component mount/update.
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && activeTab !== tabFromUrl) {
      if (tabItems.some(item => item.id === tabFromUrl)) {
        setActiveTabInternal(tabFromUrl);
      }
    }
  }, [searchParams, activeTab]); // Dependencies: searchParams changes or activeTab mismatch

  // --- Specific Handlers for Distraction List ---

  // Handler for adding a new distraction item.
  const handleAddDistraction = useCallback(
    async (title: string) => {
      if (!title.trim()) {
        showMessage('Distraction title cannot be empty.', 'error');
        return;
      }
      if (!currentUser || !appState?.activeGoalId) {
        showMessage('Please select an active goal to add a distraction.', 'error');
        return;
      }
      setIsAdding(prev => ({ ...prev, distractions: true })); // Set adding status for distractions
      try {
        await firebaseService.addDistractionItem(
          appState.activeGoalId,
          currentUser.uid,
          title.trim()
        );
        await fetchUserData(currentUser.uid); // Re-fetch all data to update the UI
        showMessage('Distraction added!', 'success');
      } catch (error) {
        console.error('Failed to add distraction:', error);
        showMessage('Failed to add distraction.', 'error');
      } finally {
        setIsAdding(prev => ({ ...prev, distractions: false })); // Clear adding status
      }
    },
    [currentUser, appState, fetchUserData, showMessage]
  );

  // Handler for updating a distraction item (e.g., title or count).
  const handleUpdateDistraction = useCallback(
    async (id: string, updates: Partial<DistractionItem>) => {
      if (!currentUser || !appState?.activeGoalId) {
        showMessage('Please select an active goal to update a distraction.', 'error');
        return;
      }
      setIsUpdatingId(id); // Set the ID of the item being updated for loading indicators
      try {
        await firebaseService.updateDistractionItem(
          appState.activeGoalId,
          currentUser.uid,
          id,
          updates
        );
        await fetchUserData(currentUser.uid); // Re-fetch to ensure consistency
        if ('count' in updates) {
          // No message for quick counter updates to avoid spamming toasts
        } else {
          showMessage('Distraction updated.', 'success');
        }
      } catch (error) {
        console.error('Failed to update distraction:', error);
        showMessage('Failed to update distraction.', 'error');
      } finally {
        setIsUpdatingId(null); // Clear updating ID
        setEditingItemId(null); // Clear editing state in DistractionListComponent
      }
    },
    [currentUser, appState, fetchUserData, showMessage]
  );

  // --- Handlers for To-Do List ---

  // Handler for adding a new To-Do item.
  const handleAddTodo = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        showMessage('Task cannot be empty.', 'error');
        return;
      }
      if (!currentUser || !appState?.activeGoalId) {
        showMessage('Please select an active goal to add a task.', 'error');
        return;
      }
      setIsAdding(prev => ({ ...prev, todo: true })); // Set adding status for todo list
      try {
        await firebaseService.addTodoItem(appState.activeGoalId, currentUser.uid, text);
        await fetchUserData(currentUser.uid); // Re-fetch to update state
        showMessage('Task added!', 'success');
      } catch (error) {
        console.error('Failed to add task:', error);
        showMessage('Failed to add task.', 'error');
      } finally {
        setIsAdding(prev => ({ ...prev, todo: false })); // Clear adding status
      }
    },
    [currentUser, appState, fetchUserData, showMessage]
  );

  // Handler for updating a To-Do item's properties.
  const handleUpdateTodo = useCallback(
    async (id: string, updates: Partial<TodoItem>) => {
      if (!currentUser || !appState?.activeGoalId) {
        showMessage('Please select an active goal to update a task.', 'error');
        return;
      }
      setIsUpdatingId(id); // Set updating ID for loading indicators
      try {
        await firebaseService.updateTodoItem(appState.activeGoalId, currentUser.uid, id, updates);
        await fetchUserData(currentUser.uid); // Re-fetch for consistency
        if ('completed' in updates && updates.completed !== undefined) {
          showMessage(updates.completed ? 'Task completed!' : 'Task updated!', 'success');
        } else {
          showMessage('Task updated.', 'success');
        }
      } catch (error) {
        console.error('Failed to update task:', error);
        showMessage('Failed to update task.', 'error');
      } finally {
        setIsUpdatingId(null); // Clear updating ID
        setEditingItemId(null); // Clear generic editing ID (if used by a child list component)
        setIsEditModalOpen(false); // Close TodoEditModal if it was open
      }
    },
    [currentUser, appState, fetchUserData, showMessage]
  );

  // Handler for reordering To-Do items.
  const handleReorderTodos = async (reorderedList: TodoItem[]) => {
    if (!currentUser || !appState?.activeGoalId) {
      showMessage('Please select an active goal to reorder tasks.', 'error');
      return;
    }
    try {
      setToDoList(reorderedList); // Optimistic UI update
      await firebaseService.updateTodoListOrder(
        appState.activeGoalId,
        currentUser.uid,
        reorderedList
      );
      showMessage('Tasks reordered!', 'success');
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
      showMessage('Failed to reorder tasks.', 'error');
      await fetchUserData(currentUser.uid); // Re-fetch on error to correct UI
    }
  };

  // Handler for opening the TodoEditModal for a specific item.
  const handleOpenTodoEditModal = useCallback((item: TodoItem) => {
    setSelectedTodoItem(item);
    setIsEditModalOpen(true);
  }, []);

  // --- Consolidated Deletion Handler ---

  // Prepares for deletion by setting the item to delete and opening the confirmation modal.
  const handleDeleteConfirmation = useCallback(
    // FIX: Make the lambda an async function so it implicitly returns Promise<void>
    async (listType: 'todo' | 'distraction' | 'sticky-note', id: string) => {
      setItemToDelete({ listType, id });
      setIsConfirmModalOpen(true);
    },
    []
  );

  // Confirms and performs the deletion based on the itemToDelete state.
  const confirmDeletion = useCallback(async () => {
    if (!currentUser || !appState?.activeGoalId || !itemToDelete) {
      showMessage('Cannot delete item: Missing information or no active goal.', 'error');
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
      return;
    }
    const { listType, id } = itemToDelete;
    const activeGoalId = appState.activeGoalId;

    try {
      // Dispatch to the correct Firebase service method based on listType
      if (listType === 'todo') {
        await firebaseService.deleteTodoItem(activeGoalId, currentUser.uid, id);
      } else if (listType === 'distraction') {
        await firebaseService.deleteDistractionItem(activeGoalId, currentUser.uid, id);
      } else if (listType === 'sticky-note') {
        await firebaseService.deleteStickyNote(activeGoalId, currentUser.uid, id);
      }
      await fetchUserData(currentUser.uid); // Re-fetch all data to update all lists and UI
      showMessage('Item removed.', 'info');
    } catch (error) {
      console.error(`Failed to remove ${listType} item:`, error);
      showMessage(`Failed to remove ${listType} item.`, 'error');
    } finally {
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
    }
  }, [currentUser, appState, itemToDelete, fetchUserData, showMessage]);

  // Memoized sorted To-Do list for consistent display order.
  const sortedToDoList = useMemo(() => {
    return [...toDoList].sort((a, b) => a.order - b.order);
  }, [toDoList]);

  // Renders the content for the currently active tab.
  const renderActiveTabContent = () => {
    // If no active goal is selected, prompt the user to set one.
    if (!appState?.activeGoalId || !appState.goals[appState.activeGoalId]) {
      return (
        <div className="p-10 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
          <FiCheckSquare className="mx-auto mb-6 w-20 h-20 text-white/70" />
          <h2 className="mb-4 text-3xl font-bold text-white">No Active Goal Found</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
            You need to set an active primary goal to manage your lists. Please select or create one
            in your dashboard settings.
          </p>
          <Link
            href="/dashboard?tab=settings" // Link to dashboard settings to guide user
            className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105"
          >
            <FiCheckSquare size={20} />
            Go to Dashboard to Set Goal
          </Link>
        </div>
      );
    }

    // Show skeleton loader if data is still loading.
    if (isLoading) {
      return <ListsPageSkeletonLoader />;
    }

    // Render the specific component based on the active tab.
    switch (activeTab) {
      case 'todo':
        return (
          <TodoList
            toDoList={sortedToDoList}
            onAddTodo={handleAddTodo}
            onUpdateTodo={handleUpdateTodo}
            // FIX: Make the anonymous function async to return Promise<void>
            onDeleteTodo={async id => handleDeleteConfirmation('todo', id)}
            onReorderTodos={handleReorderTodos}
            onEditTodo={handleOpenTodoEditModal}
            showMessage={showMessage}
            isAdding={isAdding.todo}
          />
        );
      case 'distractions': // Case for Distractions tab
        return (
          <DistractionListComponent
            list={distractionList} // Pass the specialized distractionList
            addToList={handleAddDistraction} // Pass the specific add handler
            // FIX: Make the anonymous function async to return Promise<void>
            removeFromList={async id => handleDeleteConfirmation('distraction', id)}
            updateItem={handleUpdateDistraction} // Pass the specific update handler
            placeholder="Add a distraction to avoid..."
            editingItemId={editingItemId}
            setEditingItemId={setEditingItemId}
            editText={editText}
            setEditText={setEditText}
            isAdding={isAdding.distractions} // Pass adding status
            isUpdatingId={isUpdatingId} // Pass updating ID
          />
        );
      case 'sticky-notes': // Case for Sticky Notes tab
        return (
          <StickyNotesComponent
            currentUser={currentUser} // StickyNotes component manages its own CRUD, needs these props
            appState={appState}
            showMessage={showMessage}
            onAppStateUpdate={setAppState} // Pass setAppState to trigger full data refresh from StickyNotes
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex flex-col min-h-screen text-white bg-black">
      <ToastMessage message={toastMessage} type={toastType} />

      {/* Tab Navigation Bar */}
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex flex-wrap justify-center space-x-2">
          {tabItems.map(item => {
            const Icon = item.icon; // Get icon component
            const isActive = activeTab === item.id; // Check if current tab is active
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none
                    ${isActive ? 'text-white border-blue-500' : 'border-transparent text-white/60 hover:text-white'}`}
                aria-label={item.label} // Accessibility label
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{item.label}</span>{' '}
                {/* Label on larger screens */}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="container flex-grow p-4 mx-auto max-w-4xl">
        <section className="py-8">{renderActiveTabContent()}</section>
      </div>

      {/* TodoEditModal for editing TodoItems */}
      {isEditModalOpen && (
        <TodoEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          todoItem={selectedTodoItem}
          onSave={handleUpdateTodo} // Uses specialized update handler for Todo
          showMessage={showMessage}
        />
      )}

      {/* Confirmation Modal for deleting any item */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Delete Item?"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmButton={{
          text: 'Delete',
          onClick: confirmDeletion, // Uses the consolidated confirmDeletion handler
          className: 'bg-red-600 text-white hover:bg-red-700',
        }}
        cancelButton={{ text: 'Cancel', onClick: () => setIsConfirmModalOpen(false) }}
      />
    </main>
  );
};

// Wrap the main content component in React.Suspense for Next.js client-side rendering.
export default function TodoPage() {
  return (
    <Suspense fallback={<ListsPageSkeletonLoader />}>
      {' '}
      {/* Provide a fallback during loading */}
      <ConsolidatedListPageContent />
    </Suspense>
  );
}
