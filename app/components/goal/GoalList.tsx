// app/components/goal/GoalList.tsx
'use client';

import { firebaseService } from '@/services/firebaseService';
import { AppState, Goal, GoalStatus } from '@/types';
import { differenceInDays, format as formatDate } from 'date-fns';
import { User } from 'firebase/auth';
import Fuse from 'fuse.js'; // Import Fuse.js for search functionality
import React, { useCallback, useMemo, useState } from 'react';
import {
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit,
  FiPlus,
  FiSearch,
  FiTarget,
  FiTrash2,
} from 'react-icons/fi'; // Included FiCheckCircle for active status, FiBookOpen for summary

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
  }) => void; // For Delete/Archive
}

/**
 * GoalList Component
 *
 * Displays a searchable and filterable list of all user goals.
 * Provides actions for each goal such as setting as active, editing, deleting, archiving, and viewing a summary.
 */
const GoalList: React.FC<GoalListProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
  onOpenGoalModal,
  onOpenSummaryModal,
  onOpenConfirmationModal,
}) => {
  const allGoals = useMemo(() => Object.values(appState?.goals || {}), [appState?.goals]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<GoalStatus | 'all'>('all');

  // Fuse.js options for fuzzy searching by goal name and description.
  const fuseOptions = useMemo(
    () => ({
      keys: ['name', 'description'],
      threshold: 0.3, // Adjust fuzziness: 0.0 for exact, 1.0 for very loose
    }),
    []
  );

  // Memoized list of goals, filtered by search query and status, then sorted.
  const filteredAndSortedGoals = useMemo(() => {
    let filtered = allGoals;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(goal => goal.status === filterStatus);
    }

    // Apply search query filter using Fuse.js
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
  }, [allGoals, filterStatus, searchQuery, fuseOptions]);

  // --- Goal Actions ---

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
        title: `Archive Goal: ${goal.name}?`,
        message: `This will mark "${goal.name}" as 'Completed' and remove it from your active goal. It will still be viewable here as a completed goal.`,
        action: async () => {
          if (!currentUser) return;
          try {
            // Reusing firebaseService.archiveCurrentGoal with the specific goalId
            // This method is designed to update status to COMPLETED and set activeGoalId to null.
            // We need to ensure it can work with a specific goal ID even if it's not the *current* active one
            // or adapt it. Given previous discussions, archiveCurrentGoal specifically handles the *current* active goal.
            // If this is to archive ANY goal, firebaseService.updateGoal is more appropriate.
            // Let's use updateGoal for general status change.
            await firebaseService.updateGoal(currentUser.uid, goal.id, {
              status: GoalStatus.COMPLETED,
            });

            // If the archived goal was the active one, also clear activeGoalId
            if (appState?.activeGoalId === goal.id) {
              await firebaseService.setActiveGoal(currentUser.uid, null);
            }
            const newAppState = await firebaseService.getUserData(currentUser.uid);
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

  // Render a message if no goals are available
  if (allGoals.length === 0 && !searchQuery) {
    return (
      <div className="p-10 text-center text-white/60 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <FiTarget className="mx-auto mb-4 text-4xl" />
        <h2 className="mb-4 text-2xl font-bold text-white">No Goals Yet!</h2>
        <p className="mb-6">Start by creating your first goal to track your journey.</p>
        <button
          onClick={() => onOpenGoalModal(null, false)} // Open modal to create new goal
          className="inline-flex gap-2 items-center px-6 py-3 font-semibold text-black bg-white rounded-full transition-colors hover:bg-white/90"
        >
          <FiPlus /> Create New Goal
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header and Search/Filter Controls */}
      <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
        <h2 className="mb-4 text-2xl font-bold text-center text-white">Your Goals</h2>
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            type="text"
            placeholder="Search goals by name or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="p-3 pl-10 w-full text-lg text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search goals"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
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
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                filterStatus === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {status === 'all' ? 'All' : getStatusText(status)}
            </button>
          ))}
        </div>

        {/* Create New Goal Button */}
        <div className="text-center">
          <button
            onClick={() => onOpenGoalModal(null, false)} // Open modal for new goal
            className="inline-flex gap-2 items-center px-6 py-3 font-semibold text-black bg-white rounded-full transition-colors hover:bg-white/90"
          >
            <FiPlus /> Create New Goal
          </button>
        </div>
      </div>

      {/* Goal List Display */}
      <div className="space-y-4">
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
                  <span>Start: {formatDate(goal.startDate.toDate(), 'd MMM yyyy')}</span>
                </div>
                <div className="flex gap-1 items-center">
                  <FiCalendar size={14} />
                  <span>End: {formatDate(goal.endDate.toDate(), 'd MMM yyyy')}</span>
                </div>
                <div className="flex gap-1 items-center">
                  <FiClock size={14} />
                  <span>
                    Total Days:{' '}
                    {differenceInDays(goal.endDate.toDate(), goal.startDate.toDate()) + 1}
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
                {goal.status === GoalStatus.ACTIVE && (
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
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center text-white/50">
            No goals found matching your search or filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalList;
