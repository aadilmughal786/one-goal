// app/components/stop-watch/SessionLog.tsx
'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useStopwatchActionsStore } from '@/store/useStopwatchActionsStore';
import { StopwatchSession } from '@/types';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  max,
  min,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import {
  FiActivity,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEdit,
  FiFlag,
  FiLoader,
  FiPlayCircle,
  FiTrash2,
} from 'react-icons/fi';

export default function SessionLog() {
  const { showToast, showConfirmation } = useNotificationStore();
  const { currentUser } = useAuthStore();
  const { appState } = useGoalStore();
  const { deleteStopwatchSession, updateStopwatchSession } = useStopwatchActionsStore();

  const activeGoal = useMemo(
    () => (appState?.activeGoalId ? appState.goals[appState.activeGoalId] : null),
    [appState]
  );
  const activeGoalId = activeGoal?.id;
  const goalStartDate = activeGoal?.startDate?.toDate();
  const goalEndDate = activeGoal?.endDate?.toDate();

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  const loggedDays = useMemo(() => {
    if (!activeGoal) return new Set<string>();
    return new Set(
      Object.values(activeGoal.dailyProgress || {})
        .filter(dp => dp.sessions && dp.sessions.length > 0)
        .map(dp => dp.date)
    );
  }, [activeGoal]);

  const daysInView = useMemo(() => {
    if (!goalStartDate || !goalEndDate) return [];
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const viewStart = max([goalStartDate, monthStart]);
    const viewEnd = min([goalEndDate, monthEnd]);
    if (viewStart > viewEnd) return [];
    return eachDayOfInterval({ start: viewStart, end: viewEnd });
  }, [currentMonth, goalStartDate, goalEndDate]);

  const selectedDaySessions = useMemo(() => {
    if (!selectedDay || !activeGoal?.dailyProgress) return [];
    const dateKey = format(selectedDay, 'yyyy-MM-dd');
    const sessions = activeGoal.dailyProgress[dateKey]?.sessions || [];
    return [...sessions].sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis());
  }, [selectedDay, activeGoal?.dailyProgress]);

  const selectedDayTotalTime = useMemo(() => {
    if (!selectedDaySessions || selectedDaySessions.length === 0) return 0;
    return selectedDaySessions.reduce((total, session) => total + session.duration, 0);
  }, [selectedDaySessions]);

  const canGoPrevMonth = useMemo(() => {
    if (!goalStartDate) return false;
    return !isSameMonth(currentMonth, startOfMonth(goalStartDate));
  }, [currentMonth, goalStartDate]);

  const canGoNextMonth = useMemo(() => {
    if (!goalEndDate) return false;
    return !isSameMonth(currentMonth, endOfMonth(goalEndDate));
  }, [currentMonth, goalEndDate]);

  const isTodayButtonClickable = useMemo(() => {
    if (!goalStartDate || !goalEndDate) return false;
    const today = new Date();
    return isWithinInterval(today, { start: goalStartDate, end: goalEndDate });
  }, [goalStartDate, goalEndDate]);

  const handleMonthChange = useCallback(
    (direction: 'prev' | 'next') => {
      const newMonth =
        direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1);
      setCurrentMonth(newMonth);
    },
    [currentMonth]
  );

  const handleGoToToday = useCallback(() => {
    const today = new Date();
    if (isTodayButtonClickable) {
      setCurrentMonth(startOfMonth(today));
      setSelectedDay(today);
    }
  }, [isTodayButtonClickable]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return '0s';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      hours > 0 ? `${hours}h` : null,
      minutes > 0 ? `${minutes}m` : null,
      seconds > 0 || (hours === 0 && minutes === 0) ? `${seconds}s` : null,
    ]
      .filter(Boolean)
      .join(' ');
  };

  const handleStartEditing = (session: StopwatchSession) => {
    setEditingSessionId(session.id);
    setEditText(session.label);
  };

  const handleSaveUpdate = async (session: StopwatchSession) => {
    if (!editText.trim() || !selectedDay || !activeGoalId || !currentUser) {
      showToast('Cannot save session label: Missing data or not logged in.', 'error');
      return;
    }

    const dateKey = format(selectedDay, 'yyyy-MM-dd');
    setIsUpdatingId(session.id);

    try {
      await updateStopwatchSession(dateKey, session.id, editText);
      showToast('Session label updated!', 'success');
    } catch (error) {
      console.error('Error updating session:', error);
    } finally {
      setEditingSessionId(null);
      setEditText('');
      setIsUpdatingId(null);
    }
  };

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      showConfirmation({
        title: 'Delete Session?',
        message:
          'Are you sure you want to permanently delete this logged session? This action cannot be undone.',
        action: async () => {
          if (!currentUser || !activeGoalId || !selectedDay) {
            showToast('Cannot delete session: Missing information or no active goal.', 'error');
            return;
          }

          const dateKey = format(selectedDay, 'yyyy-MM-dd');
          setIsUpdatingId(sessionId);

          try {
            await deleteStopwatchSession(dateKey, sessionId);
            showToast('Session deleted.', 'info');
          } catch (error) {
            console.error('Error deleting session:', error);
          } finally {
            setIsUpdatingId(null);
          }
        },
      });
    },
    [showConfirmation, currentUser, activeGoalId, selectedDay, showToast, deleteStopwatchSession]
  );

  if (!activeGoal) {
    return (
      <div className="mx-auto mt-12 max-w-4xl text-center text-text-secondary">
        <h3 className="flex gap-3 justify-center items-center text-2xl font-bold">
          <FiActivity /> Focus Session Log
        </h3>
        <p className="mt-4">Please select or create an active goal to view session logs.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-12 max-w-4xl">
      <div className="mb-8 text-center">
        <h3 className="flex gap-3 justify-center items-center text-2xl font-bold text-text-primary">
          <FiActivity /> Focus Session Log
        </h3>
        <p className="mt-2 text-text-secondary">
          Review your tracked work sessions for &quot;{activeGoal.name}&quot;. Select a day to see
          the details.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-sm border-border-primary bg-bg-secondary">
        <div className="flex justify-between items-center p-4 border-b sm:p-6 border-border-primary">
          <h3 className="text-xl font-bold text-text-primary">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleGoToToday}
              disabled={!isTodayButtonClickable}
              className="px-4 py-2 text-sm font-semibold rounded-full transition-colors cursor-pointer bg-bg-tertiary text-text-secondary hover:bg-border-primary disabled:opacity-30"
              aria-label="Go to today"
            >
              Today
            </button>
            <div className="flex gap-1">
              <button
                onClick={() => handleMonthChange('prev')}
                disabled={!canGoPrevMonth}
                className="p-2 rounded-full transition-colors cursor-pointer bg-bg-tertiary text-text-secondary hover:bg-border-primary disabled:opacity-30"
                aria-label="Previous month"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleMonthChange('next')}
                disabled={!canGoNextMonth}
                className="p-2 rounded-full transition-colors cursor-pointer bg-bg-tertiary text-text-secondary hover:bg-border-primary disabled:opacity-30"
                aria-label="Next month"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-border-primary">
          <div className="flex flex-wrap gap-3 justify-center">
            {daysInView.length > 0 ? (
              daysInView.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const hasLog = loggedDays.has(dateKey);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const isCurrentDay = isToday(day);

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDay(day)}
                    className={`relative flex flex-col items-center justify-start pt-2 w-16 h-16 rounded-lg transition-all duration-200 group
                      ${isSelected ? 'text-white bg-blue-500 shadow-lg' : 'text-text-primary bg-bg-tertiary hover:bg-border-primary'}
                      ${isCurrentDay && !isSelected ? 'ring-2 ring-border-accent' : 'border border-border-primary'}
                      cursor-pointer`}
                    aria-label={`Select day ${format(day, 'd MMMM')}`}
                  >
                    <span className="text-xs font-semibold text-text-tertiary">
                      {format(day, 'E')}
                    </span>
                    <span
                      className={`mt-1 text-2xl font-bold transition-colors duration-200 ${hasLog && !isSelected ? 'text-cyan-400' : ''}`}
                    >
                      {format(day, 'd')}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="col-span-full text-center text-text-muted">
                No goal days in this month.
              </p>
            )}
          </div>
        </div>

        <div className="min-h-[250px] p-6">
          <h4 className="mb-4 text-xl font-bold text-text-primary">
            {selectedDay
              ? `Logs for ${format(selectedDay, 'MMMM d, yyyy')}`
              : 'Select a day to view logs'}
          </h4>
          {selectedDay &&
            (selectedDaySessions.length > 0 ? (
              <ul className="space-y-3">
                {selectedDaySessions.map(session => {
                  const isEditing = editingSessionId === session.id;
                  const isCurrentlySaving = isUpdatingId === session.id;
                  return (
                    <li
                      key={session.id}
                      className="flex flex-col p-4 rounded-lg sm:flex-row sm:justify-between sm:items-center bg-bg-tertiary"
                    >
                      {isEditing ? (
                        <div className="flex flex-grow gap-2 items-center">
                          <input
                            type="text"
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSaveUpdate(session)}
                            autoFocus
                            disabled={isCurrentlySaving}
                            className="flex-1 py-1 text-base bg-transparent border-b-2 cursor-pointer outline-none text-text-primary border-border-primary focus:border-border-accent disabled:opacity-50"
                            aria-label="Edit session label"
                          />
                          <button
                            onClick={() => handleSaveUpdate(session)}
                            disabled={isCurrentlySaving || !editText.trim()}
                            className="p-2 text-green-400 rounded-full transition-colors cursor-pointer hover:bg-green-500/10 disabled:opacity-50"
                            aria-label="Save changes"
                          >
                            {isCurrentlySaving ? (
                              <FiLoader className="animate-spin" />
                            ) : (
                              <FiCheck />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex-grow mb-3 sm:mb-0">
                          <p className="font-semibold text-text-primary">{session.label}</p>
                          <p className="text-sm text-text-secondary">
                            Logged at {format(session.startTime.toDate(), 'h:mm a')}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2 items-center self-end sm:self-center">
                        <div className="flex gap-2 items-center px-3 py-1 font-mono text-sm text-cyan-300 rounded-full bg-cyan-500/10">
                          <FiClock size={14} />
                          {formatDuration(session.duration)}{' '}
                        </div>
                        {!isEditing && (
                          <button
                            onClick={() => handleStartEditing(session)}
                            className="p-2 rounded-full transition-colors cursor-pointer text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary"
                            aria-label="Edit session"
                          >
                            <FiEdit />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          disabled={isCurrentlySaving}
                          className="p-2 rounded-full transition-colors cursor-pointer text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                          aria-label="Delete session"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col justify-center items-center pt-10 h-full text-center text-text-muted">
                <FiClock size={32} className="mb-4" />
                <p>No focus sessions logged on this day.</p>
              </div>
            ))}
        </div>

        <div className="flex flex-col gap-4 justify-between items-center p-4 text-sm border-t sm:flex-row border-border-primary text-text-secondary">
          <div className="flex flex-wrap gap-y-2 gap-x-4 items-center">
            {goalStartDate && (
              <div className="flex gap-2 items-center" title="Goal Start Date">
                <FiPlayCircle className="text-green-400" />
                <span>Start: {format(goalStartDate, 'd MMM, yyyy')}</span>
              </div>
            )}
            {goalEndDate && (
              <div className="flex gap-2 items-center" title="Goal End Date">
                <FiFlag className="text-red-400" />
                <span>End: {format(goalEndDate, 'd MMM, yyyy')}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 items-center font-semibold text-cyan-300">
            <FiClock />
            <span>
              {selectedDay
                ? `Total for Day: ${formatDuration(selectedDayTotalTime)}`
                : 'Select a day to see total'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
