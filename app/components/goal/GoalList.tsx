// app/components/goal/GoalList.tsx
'use client';

import { Goal, GoalStatus } from '@/types';
import { differenceInDays, format as formatDate } from 'date-fns';
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

import { serializeGoalForExport } from '@/services/dataService';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';

interface GoalListProps {
  onOpenGoalModal: (goal: Goal | null, isEditMode: boolean) => void;
  onOpenSummaryModal: (goal: Goal) => void;
  searchQuery: string;
  filterStatus: GoalStatus | 'all';
}

const GoalList: React.FC<GoalListProps> = ({
  onOpenGoalModal,
  onOpenSummaryModal,
  searchQuery,
  filterStatus,
}) => {
  // FIX: Select state and actions individually from the Zustand stores.
  const appState = useGoalStore(state => state.appState);
  const setActiveGoal = useGoalStore(state => state.setActiveGoal);
  const deleteGoal = useGoalStore(state => state.deleteGoal);
  const updateGoal = useGoalStore(state => state.updateGoal);
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

  const handleSetGoalAsActive = useCallback(
    async (goalId: string) => {
      await setActiveGoal(goalId);
      showToast('Goal set as active!', 'success');
    },
    [setActiveGoal, showToast]
  );

  const handleDeleteGoal = useCallback(
    (goal: Goal) => {
      showConfirmation({
        title: `Delete Goal: ${goal.name}?`,
        message: `Are you sure you want to permanently delete "${goal.name}" and all its associated data? This action cannot be undone.`,
        action: async () => {
          await deleteGoal(goal.id);
          showToast('Goal deleted successfully.', 'info');
        },
        actionDelayMs: 5000,
      });
    },
    [deleteGoal, showToast, showConfirmation]
  );

  const handleArchiveGoal = useCallback(
    (goal: Goal) => {
      if (goal.status !== GoalStatus.ACTIVE) {
        showToast('Only active goals can be archived.', 'info');
        return;
      }
      showConfirmation({
        title: `Archive Goal: ${goal.name}?`,
        message: `This will mark "${goal.name}" as 'Completed'. If it is your active goal, it will be deactivated.`,
        action: async () => {
          await updateGoal(goal.id, { status: GoalStatus.COMPLETED });
          if (appState?.activeGoalId === goal.id) {
            await setActiveGoal(null);
          }
          showToast('Goal archived successfully!', 'success');
        },
        actionDelayMs: 3000,
      });
    },
    [updateGoal, appState?.activeGoalId, setActiveGoal, showToast, showConfirmation]
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
        showToast(`Goal "${goal.name}" exported successfully.`, 'success');
      } catch (error) {
        showToast(`Failed to export goal: ${(error as Error).message}`, 'error');
      }
    },
    [showToast]
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
