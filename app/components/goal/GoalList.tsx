// app/components/goal/GoalList.tsx
'use client';

import { AppState, Goal, GoalStatus } from '@/types';
import { differenceInDays, format as formatDate } from 'date-fns';
import { User } from 'firebase/auth';
import Fuse from 'fuse.js';
import React, { useCallback, useMemo } from 'react';
import {
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEdit,
  FiTrash2,
} from 'react-icons/fi';

// --- REFLECTING THE REFACTOR ---
// We now import specific functions from our new, focused service modules.
import { serializeGoalForExport } from '@/services/dataService';
import { deleteGoal, setActiveGoal, updateGoal } from '@/services/goalService';
// NEW: Import useNotificationStore to use showToast and showConfirmation
import { useNotificationStore } from '@/store/useNotificationStore';

interface GoalListProps {
  currentUser: User | null;
  appState: AppState | null;
  // REMOVED: showMessage is now handled internally via useNotificationStore
  // REMOVED: onOpenConfirmationModal is now handled internally via useNotificationStore
  onAppStateUpdate: (newAppState: AppState) => void;
  onOpenGoalModal: (goal: Goal | null, isEditMode: boolean) => void;
  onOpenSummaryModal: (goal: Goal) => void;
  searchQuery: string;
  filterStatus: GoalStatus | 'all';
}

/**
 * GoalList Component
 * Displays a searchable and filterable list of all user goals.
 * It has been refactored to use the new dedicated services for all its data operations.
 */
const GoalList: React.FC<GoalListProps> = ({
  currentUser,
  appState,
  // REMOVED: showMessage,
  onAppStateUpdate,
  onOpenGoalModal,
  onOpenSummaryModal,
  // REMOVED: onOpenConfirmationModal,
  searchQuery,
  filterStatus,
}) => {
  // NEW: Access showToast and showConfirmation from the global notification store
  const showToast = useNotificationStore(state => state.showToast);
  const showConfirmation = useNotificationStore(state => state.showConfirmation);

  const allGoals = useMemo(() => Object.values(appState?.goals || {}), [appState?.goals]);

  const fuseOptions = useMemo(() => ({ keys: ['name', 'description'], threshold: 0.3 }), []);

  const filteredAndSortedGoals = useMemo(() => {
    let filtered = allGoals;
    if (filterStatus !== 'all') {
      filtered = filtered.filter(goal => goal.status === filterStatus);
    }
    if (searchQuery) {
      const fuse = new Fuse(filtered, fuseOptions);
      filtered = fuse.search(searchQuery).map(result => result.item);
    }
    return filtered.sort((a, b) => {
      if (a.status === GoalStatus.ACTIVE && b.status !== GoalStatus.ACTIVE) return -1;
      if (a.status !== GoalStatus.ACTIVE && b.status === GoalStatus.ACTIVE) return 1;
      return b.endDate.toMillis() - a.endDate.toMillis();
    });
  }, [allGoals, filterStatus, searchQuery, fuseOptions]);

  // --- Goal Actions using new services ---

  const handleSetGoalAsActive = useCallback(
    async (goalId: string) => {
      if (!currentUser || !appState) return;
      try {
        await setActiveGoal(currentUser.uid, goalId);
        const newAppState = { ...appState, activeGoalId: goalId };
        onAppStateUpdate(newAppState);
        showToast('Goal set as active!', 'success'); // Use global showToast
      } catch {
        showToast('Failed to set goal as active.', 'error'); // Use global showToast
      }
    },
    [currentUser, appState, showToast, onAppStateUpdate] // Dependency on global showToast
  );

  const handleDeleteGoal = useCallback(
    (goal: Goal) => {
      showConfirmation({
        // Use global showConfirmation
        title: `Delete Goal: ${goal.name}?`,
        message: `Are you sure you want to permanently delete "${goal.name}" and all its associated data? This action cannot be undone.`,
        action: async () => {
          if (!currentUser || !appState) return;
          try {
            await deleteGoal(currentUser.uid, goal.id);
            const newGoals = { ...appState.goals };
            delete newGoals[goal.id];
            const newActiveGoalId =
              appState.activeGoalId === goal.id ? null : appState.activeGoalId;
            onAppStateUpdate({ ...appState, goals: newGoals, activeGoalId: newActiveGoalId });
            showToast('Goal deleted successfully.', 'info'); // Use global showToast
          } catch {
            showToast('Failed to delete goal.', 'error'); // Use global showToast
          }
        },
        actionDelayMs: 5000,
      });
    },
    [currentUser, appState, showToast, onAppStateUpdate, showConfirmation] // Dependencies on global showToast and showConfirmation
  );

  const handleArchiveGoal = useCallback(
    (goal: Goal) => {
      if (goal.status !== GoalStatus.ACTIVE) {
        showToast('Only active goals can be archived.', 'info'); // Use global showToast
        return;
      }
      showConfirmation({
        // Use global showConfirmation
        title: `Archive Goal: ${goal.name}?`,
        message: `This will mark "${goal.name}" as 'Completed'. If it is your active goal, it will be deactivated.`,
        action: async () => {
          if (!currentUser || !appState) return;
          try {
            await updateGoal(currentUser.uid, goal.id, { status: GoalStatus.COMPLETED });
            if (appState.activeGoalId === goal.id) {
              await setActiveGoal(currentUser.uid, null);
            }
            const updatedGoal = { ...goal, status: GoalStatus.COMPLETED };
            const updatedGoals = { ...appState.goals, [goal.id]: updatedGoal };
            const newActiveGoalId =
              appState.activeGoalId === goal.id ? null : appState.activeGoalId;
            onAppStateUpdate({ ...appState, goals: updatedGoals, activeGoalId: newActiveGoalId });
            showToast('Goal archived successfully!', 'success'); // Use global showToast
          } catch {
            showToast('Failed to archive goal.', 'error'); // Use global showToast
          }
        },
        actionDelayMs: 3000,
      });
    },
    [currentUser, appState, showToast, onAppStateUpdate, showConfirmation] // Dependencies on global showToast and showConfirmation
  );

  const handleExportSingleGoal = useCallback(
    async (goal: Goal) => {
      try {
        const serializableGoal = serializeGoalForExport(goal);
        const dataStr = JSON.stringify(serializableGoal, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `one-goal-${goal.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${formatDate(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`Goal "${goal.name}" exported successfully.`, 'success'); // Use global showToast
      } catch (error) {
        showToast(`Failed to export goal: ${(error as Error).message}`, 'error'); // Use global showToast
      }
    },
    [showToast] // Dependency on global showToast
  );

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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {filteredAndSortedGoals.length > 0 ? (
        filteredAndSortedGoals.map(goal => (
          <div
            key={goal.id}
            className={`p-4 rounded-lg border bg-white/[0.02] shadow-md transition-all ${appState?.activeGoalId === goal.id ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-white/10'}`}
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
                onClick={() => onOpenGoalModal(goal, true)}
                className="px-3 py-1 text-xs text-green-300 rounded-full bg-green-500/10 hover:bg-green-500/20"
              >
                <FiEdit className="inline mr-1" size={12} /> Edit
              </button>
              {goal.status === GoalStatus.ACTIVE && (
                <button
                  onClick={() => handleArchiveGoal(goal)}
                  className="px-3 py-1 text-xs text-orange-300 rounded-full bg-orange-500/10 hover:bg-orange-500/20"
                >
                  Archive
                </button>
              )}
              <button
                onClick={() => handleDeleteGoal(goal)}
                className="px-3 py-1 text-xs text-red-300 rounded-full bg-red-500/10 hover:bg-red-500/20"
              >
                <FiTrash2 className="inline mr-1" size={12} /> Delete
              </button>
              <button
                onClick={() => handleExportSingleGoal(goal)}
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
          No goals found matching your search or filter criteria.
        </div>
      )}
    </div>
  );
};

export default GoalList;
