// app/(root)/goal/page.tsx
'use client';

import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp
import { useRouter } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import GoalSummaryModal from '@/components/archive/GoalSummaryModal'; // Reusing GoalSummaryModal
import ConfirmationModal from '@/components/common/ConfirmationModal';
import ToastMessage from '@/components/common/ToastMessage';
import GoalModal from '@/components/dashboard/GoalModal'; // Reusing GoalModal from dashboard
import { firebaseService } from '@/services/firebaseService';
import { AppState, Goal, GoalStatus } from '@/types';

// New components for this page
import GoalDataManagement from '@/components/goal/GoalDataManagement';
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

  // --- Goal List Action Handlers ---

  /**
   * Sets a specific goal as the active goal in the AppState.
   * @param goalId The ID of the goal to set as active.
   */
  const handleSetGoalAsActive = useCallback(
    async (goalId: string) => {
      if (!currentUser || !appState) return;
      try {
        await firebaseService.setActiveGoal(currentUser.uid, goalId);
        const newAppState = await firebaseService.getUserData(currentUser.uid); // Fetch updated state
        handleAppStateUpdate(newAppState);
        showMessage('Goal set as active!', 'success');
      } catch (error) {
        console.error('Failed to set goal as active:', error);
        showMessage('Failed to set goal as active.', 'error');
      }
    },
    [currentUser, appState, showMessage, handleAppStateUpdate]
  );

  /**
   * Initiates the goal deletion process by opening a confirmation modal.
   * @param goal The goal object to be deleted.
   */
  const handleDeleteGoalConfirmation = useCallback(
    (goal: Goal) => {
      setConfirmationPropsAndOpenModal({
        // Using the common handler
        title: `Delete Goal: ${goal.name}?`,
        message: `Are you sure you want to permanently delete "${goal.name}" and all its associated data? This action cannot be undone.`,
        action: async () => {
          if (!currentUser) return;
          try {
            await firebaseService.deleteGoal(currentUser.uid, goal.id);
            const newAppState = await firebaseService.getUserData(currentUser.uid);
            handleAppStateUpdate(newAppState);
            showMessage('Goal deleted successfully.', 'info');
          } catch (error) {
            console.error('Failed to delete goal:', error);
            showMessage('Failed to delete goal.', 'error');
          }
        },
        actionDelayMs: 5000, // 5-second delay for deletion confirmation
      });
    },
    [currentUser, showMessage, handleAppStateUpdate, setConfirmationPropsAndOpenModal]
  );

  /**
   * Initiates the goal archiving process by opening a confirmation modal.
   * @param goal The goal object to be archived.
   */
  const handleArchiveGoalConfirmation = useCallback(
    (goal: Goal) => {
      // Ensure the goal is actually active before attempting to archive via this flow
      if (goal.status !== GoalStatus.ACTIVE) {
        showMessage('Only active goals can be archived via this action.', 'info');
        return;
      }

      setConfirmationPropsAndOpenModal({
        // Using the common handler
        title: `Archive Goal: ${goal.name}?`,
        message: `This will mark "${goal.name}" as 'Completed' and remove it from your active goal (if it is the active one). It will still be viewable in your goals list as a completed goal.`,
        action: async () => {
          if (!currentUser) return;
          try {
            // First, update the goal's status to COMPLETED
            await firebaseService.updateGoal(currentUser.uid, goal.id, {
              status: GoalStatus.COMPLETED,
            });

            // If the archived goal was the active one, also clear activeGoalId
            if (appState?.activeGoalId === goal.id) {
              await firebaseService.setActiveGoal(currentUser.uid, null);
            }
            const newAppState = await firebaseService.getUserData(currentUser.uid); // Re-fetch to get consistent state
            handleAppStateUpdate(newAppState);
            showMessage('Goal archived successfully!', 'success');
          } catch (error) {
            console.error('Failed to archive goal:', error);
            showMessage('Failed to archive goal.', 'error');
          }
        },
        actionDelayMs: 3000, // 3-second delay for archiving confirmation
      });
    },
    [currentUser, appState, showMessage, handleAppStateUpdate, setConfirmationPropsAndOpenModal]
  );

  // --- Data Management Handlers ---

  /**
   * Handles change event for the file input for data import.
   * Parses the JSON file and prepares for import confirmation.
   */
  const handleImportChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !currentUser) return;
      if (file.size > 5 * 1024 * 1024) {
        // Limit file size to 5MB
        showMessage('File is too large (max 5MB).', 'error');
        event.target.value = ''; // Clear input for next attempt
        return;
      }
      event.target.value = ''; // Clear file input value to allow re-uploading the same file

      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const importedRawData = JSON.parse(e.target?.result as string);
          // Deserialize the imported data to convert timestamps back to Timestamp objects
          const importedState = firebaseService.deserializeAppState(importedRawData);

          // Prepare the action for the confirmation modal
          const confirmImportAction = async () => {
            if (!currentUser) return; // Double check auth
            try {
              await firebaseService.setUserData(currentUser.uid, importedState); // Overwrite user data
              showMessage('Data imported successfully. Refreshing...', 'success');
              setTimeout(() => window.location.reload(), 2000); // Full reload to re-initialize everything
            } catch (error) {
              console.error('Failed to save imported data:', error);
              showMessage(`Failed to save imported data: ${(error as Error).message}`, 'error');
            }
          };

          // If there's an active goal, prompt for confirmation before overwriting
          if (appState?.activeGoalId && appState.goals[appState.activeGoalId]) {
            setConfirmationPropsAndOpenModal({
              // Using the common handler
              title: 'Overwrite All Data?',
              message:
                'Importing will replace all your current data. This action is irreversible. The confirm button will be enabled in 10 seconds.',
              action: confirmImportAction,
              actionDelayMs: 10000, // Long delay for critical overwrite
            });
          } else {
            // No active goal, proceed with import directly without confirmation modal
            await confirmImportAction();
          }
        } catch (error) {
          console.error('Import failed:', error);
          showMessage('Import failed: Invalid file format or corrupted data.', 'error');
        }
      };
      reader.readAsText(file); // Read the file content as text
    },
    [currentUser, appState, showMessage, setConfirmationPropsAndOpenModal]
  );

  /**
   * Handles exporting all user application data to a JSON file.
   * Serializes the current AppState and triggers a file download.
   */
  const handleExport = useCallback(async () => {
    if (!currentUser || !appState || Object.keys(appState.goals).length === 0) {
      showMessage('No data to export or user not authenticated.', 'info');
      return;
    }
    try {
      // Serialize the AppState to convert Firebase Timestamps to ISO strings for export
      const serializableData = firebaseService.serializeAppState(appState);
      const dataStr = JSON.stringify(serializableData, null, 2); // Pretty print JSON for readability
      const dataBlob = new Blob([dataStr], { type: 'application/json' }); // Create a Blob from the JSON string
      const url = URL.createObjectURL(dataBlob); // Create a temporary URL for the Blob
      const link = document.createElement('a'); // Create a temporary anchor element
      link.href = url;
      link.download = `one-goal-backup-${new Date().toISOString().split('T')[0]}.json`; // Set download filename
      document.body.appendChild(link); // Append to body to make it programmatically clickable
      link.click(); // Programmatically click the link to initiate download
      document.body.removeChild(link); // Clean up the temporary link
      URL.revokeObjectURL(url); // Release the object URL
      showMessage('Data exported successfully.', 'success');
    } catch (error) {
      console.error('Failed to export data:', error);
      showMessage(`Failed to export data: ${(error as Error).message}`, 'error');
    }
  }, [currentUser, appState, showMessage]);

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

      {/* Main Content Area */}
      <div className="container p-4 mx-auto max-w-4xl md:p-8">
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
          />

          {/* Goal Data Management Section */}
          <GoalDataManagement
            currentUser={currentUser}
            appState={appState}
            showMessage={showMessage}
            onAppStateUpdate={handleAppStateUpdate}
            onOpenConfirmationModal={setConfirmationPropsAndOpenModal} // Unified confirmation handler
          />
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
