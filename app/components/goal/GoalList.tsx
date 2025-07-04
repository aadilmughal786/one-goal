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
  FiPauseCircle,
  FiPlayCircle,
  FiTrash2,
  FiXCircle,
} from 'react-icons/fi';

import { serializeGoalsForExport } from '@/services/dataService';
import { useGoalActionsStore } from '@/store/useGoalActionsStore';
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
  const { appState } = useGoalStore();
  const { setActiveGoal, deleteGoal, updateGoal } = useGoalActionsStore();
  const { showToast, showConfirmation } = useNotificationStore();

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

  const handleActivateGoal = useCallback(
    async (goalToActivate: Goal) => {
      const currentActiveGoal = appState?.goals[appState.activeGoalId || ''];
      const confirmationMessage =
        goalToActivate.status === GoalStatus.COMPLETED
          ? `This will reactivate your completed goal "${goalToActivate.name}" and set it as your primary focus.`
          : `This will switch your primary focus to "${goalToActivate.name}".`;

      showConfirmation({
        title: 'Set Active Goal?',
        message: confirmationMessage,
        action: async () => {
          if (currentActiveGoal && currentActiveGoal.id !== goalToActivate.id) {
            await updateGoal(currentActiveGoal.id, { status: GoalStatus.PAUSED });
          }
          await updateGoal(goalToActivate.id, { status: GoalStatus.ACTIVE });
          await setActiveGoal(goalToActivate.id);
          showToast('New goal set as active!', 'success');
        },
      });
    },
    [appState, setActiveGoal, updateGoal, showToast, showConfirmation]
  );

  const handleStatusChange = useCallback(
    (goal: Goal, newStatus: GoalStatus, verb: string) => {
      let title = '';
      let message = '';

      switch (newStatus) {
        case GoalStatus.PAUSED:
          title = `Pause Goal?`;
          message = `Are you sure you want to pause "${goal.name}"? You can resume it later.`;
          break;
        case GoalStatus.COMPLETED:
          title = `Complete Goal?`;
          message = `Are you sure you want to mark "${goal.name}" as completed?`;
          break;
        case GoalStatus.CANCELLED:
          title = `Cancel Goal?`;
          message = `Are you sure you want to cancel "${goal.name}"? This is usually for goals you no longer plan to pursue.`;
          break;
      }

      showConfirmation({
        title,
        message,
        action: async () => {
          await updateGoal(goal.id, { status: newStatus });
          if (appState?.activeGoalId === goal.id) {
            await setActiveGoal(null);
          }
          showToast(`Goal ${verb.toLowerCase()}!`, 'success');
        },
      });
    },
    [updateGoal, appState?.activeGoalId, setActiveGoal, showToast, showConfirmation]
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

  const handleExportSingleGoal = useCallback(
    async (goal: Goal) => {
      try {
        const serializableGoal = serializeGoalsForExport([goal]);
        const dataStr = JSON.stringify(serializableGoal, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `one-goal-${goal.name
          .replace(/[^a-z0-9]/gi, '_')
          .toLowerCase()}-${formatDate(new Date(), 'yyyy-MM-dd')}.json`;
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
        return 'bg-green-500';
      case GoalStatus.COMPLETED:
        return 'bg-blue-500';
      case GoalStatus.PAUSED:
        return 'bg-yellow-500';
      case GoalStatus.CANCELLED:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {filteredAndSortedGoals.length > 0 ? (
        filteredAndSortedGoals.map(goal => (
          <div
            key={goal.id}
            className={`relative flex flex-col rounded-xl border bg-bg-secondary shadow-md transition-all overflow-hidden ${
              appState?.activeGoalId === goal.id
                ? 'border-border-accent ring-2 ring-border-accent/50'
                : 'border-border-primary'
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24">
              <div
                className={`absolute transform rotate-45 text-white text-xs font-semibold text-center py-1 ${getStatusColor(
                  goal.status
                )} shadow-md`}
                style={{ width: '150px', right: '-40px', top: '25px' }}
              >
                {getStatusText(goal.status)}
              </div>
            </div>

            <div className="flex-grow p-5">
              <h3 className="pr-16 text-lg font-bold truncate text-text-primary">{goal.name}</h3>
              <p className="mt-2 mb-4 h-10 text-sm text-text-secondary line-clamp-2">
                {goal.description}
              </p>
              <div className="flex flex-wrap gap-2 justify-end">
                {goal.status !== GoalStatus.ACTIVE && (
                  <button
                    onClick={() => handleActivateGoal(goal)}
                    className="p-2 text-green-300 rounded-full transition-colors cursor-pointer bg-green-500/10 hover:bg-green-500/20"
                    title="Activate Goal"
                  >
                    <FiPlayCircle size={18} />
                  </button>
                )}
                {goal.status === GoalStatus.ACTIVE && (
                  <>
                    <button
                      onClick={() => handleStatusChange(goal, GoalStatus.PAUSED, 'Paused')}
                      className="p-2 text-yellow-300 rounded-full transition-colors cursor-pointer bg-yellow-500/10 hover:bg-yellow-500/20"
                      title="Pause Goal"
                    >
                      <FiPauseCircle size={18} />
                    </button>
                    <button
                      onClick={() => handleStatusChange(goal, GoalStatus.COMPLETED, 'Completed')}
                      className="p-2 text-blue-300 rounded-full transition-colors cursor-pointer bg-blue-500/10 hover:bg-blue-500/20"
                      title="Complete Goal"
                    >
                      <FiCheckCircle size={18} />
                    </button>
                    <button
                      onClick={() => handleStatusChange(goal, GoalStatus.CANCELLED, 'Cancelled')}
                      className="p-2 text-orange-300 rounded-full transition-colors cursor-pointer bg-orange-500/10 hover:bg-orange-500/20"
                      title="Cancel Goal"
                    >
                      <FiXCircle size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-border-primary">
              <div className="p-5 space-y-2 text-sm text-text-tertiary">
                <div className="flex justify-between">
                  <span className="flex gap-1.5 items-center">
                    <FiCalendar size={14} />
                    Start:
                  </span>
                  <span>{formatDate(goal.startDate.toDate(), 'd MMM yy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex gap-1.5 items-center">
                    <FiCalendar size={14} />
                    End:
                  </span>
                  <span>{formatDate(goal.endDate.toDate(), 'd MMM yy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex gap-1.5 items-center">
                    <FiClock size={14} />
                    Duration:
                  </span>
                  <span>
                    {differenceInDays(goal.endDate.toDate(), goal.startDate.toDate()) + 1} days
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-border-primary">
              <div className="flex flex-wrap gap-2 justify-end p-5">
                <button
                  onClick={() => onOpenSummaryModal(goal)}
                  className="p-2 text-purple-300 rounded-full transition-colors cursor-pointer bg-purple-500/10 hover:bg-purple-500/20"
                  title="View Summary"
                >
                  <FiBookOpen size={18} />
                </button>
                <button
                  onClick={() => onOpenGoalModal(goal, true)}
                  className="p-2 text-indigo-300 rounded-full transition-colors cursor-pointer bg-indigo-500/10 hover:bg-indigo-500/20"
                  title="Edit Goal"
                >
                  <FiEdit size={18} />
                </button>
                <button
                  onClick={() => handleExportSingleGoal(goal)}
                  className="p-2 text-teal-300 rounded-full transition-colors cursor-pointer bg-teal-500/10 hover:bg-teal-500/20"
                  title="Export Goal"
                >
                  <FiDownload size={18} />
                </button>
                <button
                  onClick={() => handleDeleteGoal(goal)}
                  className="p-2 text-red-300 rounded-full transition-colors cursor-pointer bg-red-500/10 hover:bg-red-500/20"
                  title="Delete Goal"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-full py-10 text-center text-text-muted">
          No goals found matching your search or filter criteria.
        </div>
      )}
    </div>
  );
};

export default GoalList;
