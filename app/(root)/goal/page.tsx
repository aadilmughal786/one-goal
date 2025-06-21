// app/(root)/goal/page.tsx
'use client';

import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { FiSearch } from 'react-icons/fi'; // FiPlus still needed for CreateGoalCard

import GoalSummaryModal from '@/components/archive/GoalSummaryModal';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import ToastMessage from '@/components/common/ToastMessage';
import GoalModal from '@/components/dashboard/GoalModal';
import { firebaseService } from '@/services/firebaseService';
import { AppState, Goal, GoalStatus } from '@/types';

// Components for this page
import GoalList from '@/components/goal/GoalList';

// Page-level Skeleton Loader
const GoalPageSkeletonLoader = () => (
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
    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl shadow-lg">
      <div className="mb-2 w-1/3 h-8 rounded-lg bg-white/10"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 rounded-lg bg-white/5"></div>
        <div className="h-24 rounded-lg bg-white/5"></div>
      </div>
    </div>
  </div>
);

/**
 * GoalPageContent Component
 *
 * This is the main component for the /goal route. It manages all user goals,
 * providing functionalities for listing, creating, editing, deleting, archiving,
 * and importing/exporting goal data.
 */
const GoalPageContent = () => {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States for GoalModal (create/edit goal)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoalForModal, setSelectedGoalForModal] = useState<Goal | null>(null); // Goal being edited/viewed
  const [isGoalModalEditMode, setIsGoalModalEditMode] = useState(false); // True if editing, false if creating

  // States for GoalSummaryModal (view goal summary)
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedGoalForSummary, setSelectedGoalForSummary] = useState<Goal | null>(null);

  // States for ConfirmationModal (delete/archive/import overwrite)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmationProps, setConfirmationProps] = useState<{
    title: string;
    message: string;
    action: () => Promise<void> | void;
    actionDelayMs?: number;
  }>({
    title: '',
    message: '',
    action: () => {},
    actionDelayMs: 0,
  });

  // States for search and filter (managed here, passed to GoalList)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<GoalStatus | 'all'>('all');

  // Toast message states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  /**
   * Displays a toast message to the user.
   * @param text The message content.
   * @param type The type of the toast (success, error, info).
   */
  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 5000); // Hide after 5 seconds
  }, []);

  /**
   * Callback to update the global appState. Passed down to child components.
   */
  const handleAppStateUpdate = useCallback((newAppState: AppState) => {
    setAppState(newAppState);
  }, []);

  // --- Common handler for opening the ConfirmationModal ---
  // This function sets the props for the modal and then opens it.
  const setConfirmationPropsAndOpenModal = useCallback(
    (props: {
      title: string;
      message: string;
      action: () => Promise<void> | void;
      actionDelayMs?: number;
    }) => {
      setConfirmationProps(props);
      setIsConfirmModalOpen(true);
    },
    []
  );

  // --- Authentication and Initial Data Fetching ---
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      if (user) {
        setCurrentUser(user);
        firebaseService
          .getUserData(user.uid)
          .then(data => {
            setAppState(data);
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Error fetching user data:', error);
            showMessage('Failed to load goals.', 'error');
            setIsLoading(false);
          });
      } else {
        router.replace('/login'); // Redirect unauthenticated users
      }
    });
    return () => unsubscribe(); // Cleanup Firebase auth listener
  }, [router, showMessage]);

  // --- Goal Modal Handlers (Create/Edit) ---

  /**
   * Opens the GoalModal for creating a new goal or editing an existing one.
   * @param goal The Goal object to edit, or null to create a new one.
   * @param isEditMode True if opening for edit, false for create.
   */
  const handleOpenGoalModal = useCallback((goal: Goal | null, isEditMode: boolean) => {
    setSelectedGoalForModal(goal);
    setIsGoalModalEditMode(isEditMode);
    setIsGoalModalOpen(true);
  }, []);

  /**
   * Handles saving a new or updated goal. This is passed to GoalModal.
   * @param name The goal's name.
   * @param endDate The goal's end date.
   * @param description The goal's description.
   */
  const handleSetGoal = useCallback(
    async (name: string, endDate: Date, description: string) => {
      if (!currentUser || !appState) {
        showMessage('Authentication required to set goal.', 'error');
        return;
      }

      try {
        if (isGoalModalEditMode && selectedGoalForModal) {
          // Update existing goal
          const updatedGoal: Goal = {
            ...selectedGoalForModal,
            name: name,
            description: description,
            endDate: Timestamp.fromDate(endDate),
            updatedAt: Timestamp.now(),
          };
          await firebaseService.updateGoal(currentUser.uid, selectedGoalForModal.id, updatedGoal);
          // Update appState locally to reflect change
          const newGoals = { ...appState.goals, [updatedGoal.id]: updatedGoal };
          handleAppStateUpdate({ ...appState, goals: newGoals });
          showMessage('Goal updated successfully!', 'success');
        } else {
          // Create new goal
          const newGoalData: Omit<
            Goal,
            | 'id'
            | 'createdAt'
            | 'updatedAt'
            | 'dailyProgress'
            | 'toDoList'
            | 'notToDoList'
            | 'stickyNotes'
            | 'routineSettings'
            | 'starredQuotes'
          > = {
            name: name,
            description: description,
            startDate: Timestamp.now(),
            endDate: Timestamp.fromDate(endDate),
            status: GoalStatus.ACTIVE, // New goals are active by default
          };
          const createdGoal = await firebaseService.createGoal(currentUser.uid, newGoalData);
          // Update appState locally to add new goal
          const newGoals = { ...appState.goals, [createdGoal.id]: createdGoal };
          // If no active goal exists, make the newly created one active
          const newActiveGoalId = appState.activeGoalId || createdGoal.id;
          await firebaseService.setActiveGoal(currentUser.uid, newActiveGoalId); // Ensure active goal is set in Firebase
          handleAppStateUpdate({ ...appState, goals: newGoals, activeGoalId: newActiveGoalId });
          showMessage('Goal created successfully!', 'success');
        }
        setIsGoalModalOpen(false); // Close modal
      } catch (error) {
        console.error('Failed to save goal:', error);
        showMessage('Failed to save goal.', 'error');
      }
    },
    [
      currentUser,
      appState,
      isGoalModalEditMode,
      selectedGoalForModal,
      showMessage,
      handleAppStateUpdate,
    ]
  );

  // --- Goal Summary Modal Handlers ---

  /**
   * Opens the GoalSummaryModal for a specific goal.
   * @param goal The goal to display summary for.
   */
  const handleOpenSummaryModal = useCallback((goal: Goal) => {
    setSelectedGoalForSummary(goal);
    setIsSummaryModalOpen(true);
  }, []);

  // Helper to construct initialGoalData for GoalModal when editing
  const transformedGoalForModal = useMemo(() => {
    return selectedGoalForModal // Use selectedGoalForModal for this transformation
      ? {
          name: selectedGoalForModal.name,
          description: selectedGoalForModal.description,
          startDate: selectedGoalForModal.startDate.toDate().toISOString(),
          endDate: selectedGoalForModal.endDate.toDate().toISOString(),
        }
      : null;
  }, [selectedGoalForModal]); // Dependency: selectedGoalForModal changes

  // Function to get display text for goal status (for filter buttons)
  const getStatusText = useCallback((status: GoalStatus | 'all') => {
    switch (status) {
      case 'all':
        return 'All';
      case GoalStatus.ACTIVE:
        return 'Active';
      case GoalStatus.COMPLETED:
        return 'Completed';
      case GoalStatus.PAUSED:
        return 'Paused';
      case GoalStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }, []);

  // Display skeleton loader while page data is loading
  if (isLoading) {
    return (
      <main className="px-6 py-8 mx-auto max-w-4xl sm:px-8 lg:px-12">
        <GoalPageSkeletonLoader />
      </main>
    );
  }

  // Render a message if no user is authenticated (should be rare due to router.replace)
  if (!currentUser) {
    return (
      <div className="p-10 text-center text-white/60">
        <p>Please log in to manage your goals.</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      {/* Toast Message Display */}
      <ToastMessage message={toastMessage} type={toastType} />

      {/* Header with Search and Filter */}
      <nav className="flex flex-col px-4 pt-3 border-b backdrop-blur-md bg-black/50 border-white/10">
        {/* Page Context/Description */}
        <div className="mb-4 text-center">
          {' '}
          {/* Added margin-bottom */}
          <h2 className="mb-1 text-2xl font-bold text-white">Your Goal Hub</h2>
          <p className="text-sm text-white/70">
            Manage all your past, present, and future goals in one place.
          </p>
        </div>

        {/* Search Input (Centered horizontally with increased max-width) */}
        <div className="relative mx-auto mb-3 w-full max-w-xl">
          {' '}
          {/* max-w-xl for wider search, mx-auto for centering, mb for space below */}
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            type="text"
            placeholder="Search goals by name or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="p-3 pl-10 w-full h-12 text-lg text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search goals"
          />
        </div>

        {/* Status Filter Buttons (Aligned below search bar, tab-like style) */}
        <div className="flex flex-wrap gap-2 justify-center w-full">
          {' '}
          {/* No mt-2 needed as mb is on search bar */}
          {(
            [
              'all',
              GoalStatus.ACTIVE,
              GoalStatus.COMPLETED,
              GoalStatus.PAUSED,
              GoalStatus.CANCELLED,
            ] as const
          ).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              // Apply tab-like border design (removed rounded-full)
              className={`px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none
                ${
                  filterStatus === status
                    ? 'text-white border-blue-500 bg-transparent' // Active state: text-white, blue border, NO background
                    : 'border-transparent text-white/60 hover:bg-white/10 hover:border-white/5' // Inactive state: subtle text, transparent border, hover effects
                }`}
              aria-label={`Filter goals by ${getStatusText(status)} status`}
            >
              {getStatusText(status)}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="container p-4 mx-auto max-w-5xl md:p-8">
        <section className="py-8 space-y-8">
          {/* Goal List Section */}
          <GoalList
            currentUser={currentUser}
            appState={appState}
            showMessage={showMessage}
            onAppStateUpdate={handleAppStateUpdate}
            onOpenGoalModal={handleOpenGoalModal} // Pass handler for creating/editing goals
            onOpenSummaryModal={handleOpenSummaryModal} // Pass handler for viewing summaries
            onOpenConfirmationModal={setConfirmationPropsAndOpenModal} // Unified confirmation handler
            // Pass search and filter states to GoalList
            searchQuery={searchQuery}
            filterStatus={filterStatus}
          />

          {/* Goal Data Management Section (removed from here, as per user's request) */}
          {/*
            The GoalDataManagement component handles app-level import/export.
            According to the latest instructions, this functionality is now on the Profile page.
            So, it is correctly removed from the /goal page.
          */}
        </section>
      </div>

      {/* Modals (rendered at top-level for consistent overlay) */}

      {/* Goal Modal (for setting/editing goals) */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSetGoal={handleSetGoal} // Handles saving the goal
        showMessage={showMessage}
        initialGoalData={isGoalModalEditMode ? transformedGoalForModal : null}
        isEditMode={isGoalModalEditMode}
      />

      {/* Goal Summary Modal */}
      <GoalSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        goal={selectedGoalForSummary}
      />

      {/* Confirmation Modal (for delete/archive/import overwrite) */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={confirmationProps.title}
        message={confirmationProps.message}
        confirmButton={{
          text: 'Confirm',
          onClick: () => {
            confirmationProps.action(); // Execute the action defined in confirmationProps
            setIsConfirmModalOpen(false); // Close modal after action
          },
          className: 'bg-red-600 text-white hover:bg-red-700', // Default danger style
        }}
        cancelButton={{ text: 'Cancel', onClick: () => setIsConfirmModalOpen(false) }}
        actionDelayMs={confirmationProps.actionDelayMs} // Apply delay to confirm button
      />
    </main>
  );
};

// Wrapper component to use React.Suspense for client-side hooks like useRouter
export default function GoalPage() {
  return (
    <Suspense fallback={<GoalPageSkeletonLoader />}>
      <GoalPageContent />
    </Suspense>
  );
}
