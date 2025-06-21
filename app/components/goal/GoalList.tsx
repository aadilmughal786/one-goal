// app/components/goal/GoalList.tsx
'use client';

import { AppState, Goal, GoalStatus } from '@/types';
import { differenceInDays, format as formatDate } from 'date-fns';
import { User } from 'firebase/auth';
import Fuse from 'fuse.js'; // Import Fuse.js for search functionality
import React, { useCallback, useMemo } from 'react';
import {
  FiBookOpen,
  FiCalendar, // Not directly used but good icon
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEdit,
  FiTrash2,
} from 'react-icons/fi';

// Import the CreateGoalCard component
import CreateGoalCard from '@/components/goal/CreateGoalCard';
import { firebaseService } from '@/services/firebaseService'; // Import firebaseService for export

interface GoalListProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
  onOpenGoalModal: (goal: Goal | null, isEditMode: boolean) => void; // For Create/Edit Goal
  onOpenSummaryModal: (goal: Goal) => void; // For View Summary
  onOpenConfirmationModal: (props: {
    title: string;
    message: string;
    action: () => Promise<void> | void;
    actionDelayMs?: number;
  }) => void; // For Delete/Archive/Import Confirmation

  // NEW PROPS: Search and filter states are now passed from parent
  searchQuery: string;
  filterStatus: GoalStatus | 'all';
}

/**
 * GoalList Component
 *
 * Displays a searchable and filterable list of all user goals using a responsive grid layout.
 * It consumes search and filter states from its parent. Includes a dedicated card for creating new goals.
 */
const GoalList: React.FC<GoalListProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
  onOpenGoalModal,
  onOpenSummaryModal,
  onOpenConfirmationModal,
  // NEW: Destructure search and filter props
  searchQuery,
  filterStatus,
}) => {
  // All goals from the appState, memoized to prevent unnecessary re-renders.
  const allGoals = useMemo(() => Object.values(appState?.goals || {}), [appState?.goals]);

  // Fuse.js options for fuzzy searching by goal name and description.
  const fuseOptions = useMemo(
    () => ({
      keys: ['name', 'description'],
      threshold: 0.3, // Adjust fuzziness: 0.0 for exact, 1.0 for very loose
    }),
    []
  );

  // Memoized list of goals, filtered by search query and status (received from props), then sorted.
  const filteredAndSortedGoals = useMemo(() => {
    let filtered = allGoals;

    // Apply status filter from props
    if (filterStatus !== 'all') {
      filtered = filtered.filter(goal => goal.status === filterStatus);
    }

    // Apply search query filter from props using Fuse.js
    if (searchQuery) {
      const fuse = new Fuse(filtered, fuseOptions);
      filtered = fuse.search(searchQuery).map(result => result.item);
    }

    // Sort goals: Active first, then by endDate (most recent active, oldest completed/paused)
    return filtered.sort((a, b) => {
      // Prioritize ACTIVE goals
      if (a.status === GoalStatus.ACTIVE && b.status !== GoalStatus.ACTIVE) return -1;
      if (a.status !== GoalStatus.ACTIVE && b.status === GoalStatus.ACTIVE) return 1;

      // For non-active goals, sort by endDate (most recent completed/paused/cancelled first)
      return b.endDate.toMillis() - a.endDate.toMillis();
    });
  }, [allGoals, filterStatus, searchQuery, fuseOptions]); // Dependencies now include props

  // --- Goal Actions (handlers remain the same, just called via props) ---

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
        onAppStateUpdate(newAppState);
        showMessage('Goal set as active!', 'success');
      } catch (error) {
        console.error('Failed to set goal as active:', error);
        showMessage('Failed to set goal as active.', 'error');
      }
    },
    [currentUser, appState, showMessage, onAppStateUpdate]
  );

  /**
   * Initiates the goal deletion process by opening a confirmation modal.
   * @param goal The goal object to be deleted.
   */
  const handleDeleteGoal = useCallback(
    (goal: Goal) => {
      onOpenConfirmationModal({
        // Using page-level confirmation modal
        title: `Delete Goal: ${goal.name}?`,
        message: `Are you sure you want to permanently delete "${goal.name}" and all its associated data? This action cannot be undone.`,
        action: async () => {
          if (!currentUser) return;
          try {
            await firebaseService.deleteGoal(currentUser.uid, goal.id);
            const newAppState = await firebaseService.getUserData(currentUser.uid);
            onAppStateUpdate(newAppState);
            showMessage('Goal deleted successfully.', 'info');
          } catch (error) {
            console.error('Failed to delete goal:', error);
            showMessage('Failed to delete goal.', 'error');
          }
        },
        actionDelayMs: 5000, // 5-second delay for deletion confirmation
      });
    },
    [currentUser, showMessage, onAppStateUpdate, onOpenConfirmationModal]
  );

  /**
   * Initiates the goal archiving process by opening a confirmation modal.
   * @param goal The goal object to be archived.
   */
  const handleArchiveGoal = useCallback(
    (goal: Goal) => {
      // Ensure the goal is actually active before attempting to archive via this flow
      if (goal.status !== GoalStatus.ACTIVE) {
        showMessage('Only active goals can be archived via this action.', 'info');
        return;
      }

      onOpenConfirmationModal({
        // Using page-level confirmation modal
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
            onAppStateUpdate(newAppState);
            showMessage('Goal archived successfully!', 'success');
          } catch (error) {
            console.error('Failed to archive goal:', error);
            showMessage('Failed to archive goal.', 'error');
          }
        },
        actionDelayMs: 3000, // 3-second delay for archiving confirmation
      });
    },
    [currentUser, appState, showMessage, onAppStateUpdate, onOpenConfirmationModal]
  );

  /**
   * Handles exporting a single goal's data to a JSON file.
   * @param goal The Goal object to export.
   */
  const handleExportSingleGoal = useCallback(
    async (goal: Goal) => {
      if (!currentUser || !appState) {
        showMessage('Authentication required to export goal.', 'error');
        return;
      }
      try {
        // Serialize the specific Goal object using the new service method
        const serializableGoal = firebaseService.serializeGoalForExport(goal);
        const dataStr = JSON.stringify(serializableGoal, null, 2); // Pretty print JSON
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `one-goal-${goal.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${formatDate(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showMessage(`Goal "${goal.name}" exported successfully.`, 'success');
      } catch (error) {
        console.error('Failed to export goal:', error);
        showMessage(`Failed to export goal: ${(error as Error).message}`, 'error');
      }
    },
    [currentUser, appState, showMessage]
  );

  // Function to get display text for goal status
  const getStatusText = useCallback((status: GoalStatus) => {
    switch (status) {
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

  const getStatusColor = useCallback((status: GoalStatus) => {
    switch (status) {
      case GoalStatus.ACTIVE:
        return 'text-green-400';
      case GoalStatus.COMPLETED:
        return 'text-blue-400';
      case GoalStatus.PAUSED:
        return 'text-yellow-400';
      case GoalStatus.CANCELLED:
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  }, []);

  return (
    // Responsive Grid Layout
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* CreateGoalCard is always the first item in the grid */}
      <CreateGoalCard
        currentUser={currentUser}
        appState={appState}
        showMessage={showMessage}
        onAppStateUpdate={onAppStateUpdate}
        onOpenGoalModal={onOpenGoalModal}
        onOpenConfirmationModal={onOpenConfirmationModal} // Pass confirmation modal handler
      />

      {/* Render filtered and sorted goals */}
      {filteredAndSortedGoals.length > 0 ? (
        filteredAndSortedGoals.map(goal => (
          <div
            key={goal.id}
            className={`p-4 rounded-lg border bg-white/[0.02] shadow-md transition-all
                        ${appState?.activeGoalId === goal.id ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-white/10'}`}
          >
            <div className="flex flex-col justify-between items-start mb-3 md:flex-row md:items-center md:mb-0">
              <div>
                <h3 className="text-lg font-bold text-white">{goal.name}</h3>
                <p className="text-sm text-white/70">{goal.description}</p>
              </div>
              <div className="flex items-center mt-2 md:mt-0">
                <span className={`text-xs font-semibold mr-2 ${getStatusColor(goal.status)}`}>
                  {getStatusText(goal.status).toUpperCase()}
                </span>
                {goal.status === GoalStatus.ACTIVE && appState?.activeGoalId === goal.id && (
                  <FiCheckCircle size={16} className="text-blue-500" title="Currently active" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-3 mt-3 text-sm border-t sm:grid-cols-2 text-white/60 border-white/10">
              <div className="flex gap-1 items-center">
                <FiCalendar size={14} />
                <span>Start: {formatDate(goal.startDate.toDate(), 'd MMM yy')}</span>
              </div>
              <div className="flex gap-1 items-center">
                <FiCalendar size={14} />
                <span>End: {formatDate(goal.endDate.toDate(), 'd MMM yy')}</span>
              </div>
              <div className="flex gap-1 items-center">
                <FiClock size={14} />
                <span>
                  Total Days: {differenceInDays(goal.endDate.toDate(), goal.startDate.toDate()) + 1}
                </span>
              </div>
            </div>

            {/* Action Buttons for each Goal */}
            <div className="flex flex-wrap gap-2 justify-end pt-4 mt-4 border-t border-white/10">
              {goal.id !== appState?.activeGoalId && (
                <button
                  onClick={() => handleSetGoalAsActive(goal.id)}
                  disabled={
                    goal.status === GoalStatus.COMPLETED || goal.status === GoalStatus.CANCELLED
                  }
                  className="px-3 py-1 text-xs text-blue-300 rounded-full bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50"
                >
                  Set as Active
                </button>
              )}
              <button
                onClick={() => onOpenSummaryModal(goal)}
                className="px-3 py-1 text-xs text-purple-300 rounded-full bg-purple-500/10 hover:bg-purple-500/20"
              >
                <FiBookOpen className="inline mr-1" size={12} /> Summary
              </button>
              <button
                onClick={() => onOpenGoalModal(goal, true)} // Open modal in edit mode
                className="px-3 py-1 text-xs text-green-300 rounded-full bg-green-500/10 hover:bg-green-500/20"
              >
                <FiEdit className="inline mr-1" size={12} /> Edit
              </button>
              {goal.status === GoalStatus.ACTIVE && ( // Only show archive for active goals
                <button
                  onClick={() => handleArchiveGoal(goal)} // Archive action
                  className="px-3 py-1 text-xs text-orange-300 rounded-full bg-orange-500/10 hover:bg-orange-500/20"
                >
                  Archive
                </button>
              )}
              <button
                onClick={() => handleDeleteGoal(goal)} // Delete action
                className="px-3 py-1 text-xs text-red-300 rounded-full bg-red-500/10 hover:bg-red-500/20"
              >
                <FiTrash2 className="inline mr-1" size={12} /> Delete
              </button>
              {/* NEW: Export Single Goal Button */}
              <button
                onClick={() => handleExportSingleGoal(goal)} // Export single goal action
                className="px-3 py-1 text-xs text-purple-300 rounded-full bg-purple-500/10 hover:bg-purple-500/20"
                title={`Export "${goal.name}"`}
              >
                <FiDownload className="inline mr-1" size={12} /> Export
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-full py-10 text-center text-white/50">
          {' '}
          {/* col-span-full to center in grid */}
          No goals found matching your search or filter criteria.
        </div>
      )}
    </div>
  );
};

export default GoalList;
