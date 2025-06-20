// app/components/stop-watch/SessionLog.tsx
'use client';

import { AppState, StopwatchSession } from '@/types'; // Import GoalStatus
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

interface SessionLogProps {
  appState: AppState | null;
  // onDeleteSession now takes sessionId (string) instead of startTime (Timestamp)
  // to align with typical ID-based deletion in lists and prevent issues with exact Timestamp matching.
  onDeleteSession: (goalId: string, dateKey: string, sessionId: string) => Promise<void>;
  // onUpdateSession now takes sessionId (string) instead of startTime (Timestamp)
  // to align with typical ID-based updates in lists.
  onUpdateSession: (
    goalId: string,
    dateKey: string,
    sessionId: string,
    newLabel: string
  ) => Promise<void>;
  isUpdatingId: string | null;
}

export default function SessionLog({
  appState,
  onDeleteSession,
  onUpdateSession,
  isUpdatingId,
}: SessionLogProps) {
  // Ensure we have an active goal and its ID before proceeding
  const activeGoal = appState?.goals[appState.activeGoalId || ''];
  const activeGoalId = appState?.activeGoalId;

  // Derive goal start and end dates if an active goal exists
  const goalStartDate = activeGoal?.startDate?.toDate();
  const goalEndDate = activeGoal?.endDate?.toDate();

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Memoized set of dates that have logged sessions for the active goal
  const loggedDays = useMemo(() => {
    if (!activeGoal) return new Set<string>();
    return new Set(
      Object.values(activeGoal.dailyProgress || {})
        .filter(dp => dp.sessions && dp.sessions.length > 0) // Changed from 'stopwatchSessions' to 'sessions'
        .map(dp => dp.date)
    );
  }, [activeGoal]);

  // Memoized list of days to display in the calendar view for the current month,
  // constrained by the active goal's start and end dates.
  const daysInView = useMemo(() => {
    if (!goalStartDate || !goalEndDate) return []; // Ensure goal dates exist
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const viewStart = max([goalStartDate, monthStart]);
    const viewEnd = min([goalEndDate, monthEnd]);
    // If the interval is invalid (e.g., viewStart > viewEnd), return empty array
    if (viewStart > viewEnd) return [];
    return eachDayOfInterval({ start: viewStart, end: viewEnd });
  }, [currentMonth, goalStartDate, goalEndDate]);

  // Memoized list of stopwatch sessions for the currently selected day.
  // Sessions are sorted by start time, most recent first.
  const selectedDaySessions = useMemo(() => {
    if (!selectedDay || !activeGoal?.dailyProgress) return [];
    const dateKey = format(selectedDay, 'yyyy-MM-dd');
    // Changed from 'stopwatchSessions' to 'sessions'
    const sessions = activeGoal.dailyProgress[dateKey]?.sessions || [];
    return [...sessions].sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis());
  }, [selectedDay, activeGoal?.dailyProgress]);

  // Calculate total time for ONLY the selected day.
  const selectedDayTotalTime = useMemo(() => {
    if (!selectedDaySessions || selectedDaySessions.length === 0) return 0;
    // Changed from 'durationMs' to 'duration' as per StopwatchSession type
    return selectedDaySessions.reduce((total, session) => total + session.duration, 0);
  }, [selectedDaySessions]);

  // Determine if the "Previous Month" button should be enabled.
  const canGoPrevMonth = useMemo(() => {
    if (!goalStartDate) return false;
    return !isSameMonth(currentMonth, startOfMonth(goalStartDate));
  }, [currentMonth, goalStartDate]);

  // Determine if the "Next Month" button should be enabled.
  const canGoNextMonth = useMemo(() => {
    if (!goalEndDate) return false;
    return !isSameMonth(currentMonth, endOfMonth(goalEndDate));
  }, [currentMonth, goalEndDate]);

  // Handles changing the displayed month in the calendar.
  const handleMonthChange = useCallback(
    (direction: 'prev' | 'next') => {
      const newMonth =
        direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1);
      setCurrentMonth(newMonth);
    },
    [currentMonth]
  );

  // Navigates the calendar view to the current day, if it's within the goal's active range.
  const handleGoToToday = useCallback(() => {
    const today = new Date();
    if (!goalStartDate || !goalEndDate) {
      // If goal dates are not set, just go to today's month and select today
      setCurrentMonth(startOfMonth(today));
      setSelectedDay(today);
      return;
    }

    // Check if 'today' is within the active goal's start and end dates
    if (isWithinInterval(today, { start: goalStartDate, end: goalEndDate })) {
      setCurrentMonth(startOfMonth(today));
      setSelectedDay(today);
    } else {
      // If today is outside the goal range, just go to today's month, but keep current selected day
      setCurrentMonth(startOfMonth(today));
      // Optionally, you might want to clear selectedDay or set it to null if it's outside the current month view
      // For now, it will remain as is or be reset by the month change if it's outside.
    }
  }, [goalStartDate, goalEndDate]);

  // Formats duration in milliseconds into a human-readable string (e.g., "1h 30m 5s").
  const formatDuration = (ms: number) => {
    if (ms < 1000) return '0s'; // Less than a second
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      hours > 0 ? `${hours}h` : null,
      minutes > 0 ? `${minutes}m` : null,
      seconds > 0 || (hours === 0 && minutes === 0) ? `${seconds}s` : null, // Show seconds if total is 0
    ]
      .filter(Boolean) // Remove nulls
      .join(' ');
  };

  // Initiates the editing state for a specific session.
  const handleStartEditing = (session: StopwatchSession) => {
    setEditingSessionId(session.id); // Use session.id for editing
    setEditText(session.label);
  };

  // Saves the updated session label to Firebase.
  const handleSaveUpdate = async (session: StopwatchSession) => {
    if (!editText.trim() || !selectedDay || !activeGoalId) return; // Ensure all necessary data is present
    const dateKey = format(selectedDay, 'yyyy-MM-dd');
    await onUpdateSession(activeGoalId, dateKey, session.id, editText); // Pass goalId and sessionId
    setEditingSessionId(null); // Exit editing mode
    setEditText(''); // Clear edit text
  };

  // If there's no active goal, display a message and return early.
  if (!activeGoal) {
    return (
      <div className="mx-auto mt-12 max-w-4xl text-center text-white/60">
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
        <h3 className="flex gap-3 justify-center items-center text-2xl font-bold">
          <FiActivity /> Focus Session Log
        </h3>
        <p className="mt-2 text-white/60">
          Review your tracked work sessions for &quot;{activeGoal.name}&quot;. Select a day to see
          the details.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-sm">
        {/* Calendar Header: Month Navigation */}
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h4 className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h4>{' '}
            {/* Added yyyy for clarity */}
            <div className="flex gap-4 items-center">
              <button
                onClick={handleGoToToday}
                className="px-3 py-1 text-sm text-white rounded-md border transition-colors cursor-pointer bg-white/10 border-white/20 hover:bg-white/20"
                aria-label="Go to today"
              >
                Today
              </button>
              <div className="w-px h-5 bg-white/20"></div> {/* Vertical Separator */}
              <div className="flex gap-1 items-center">
                <button
                  onClick={() => handleMonthChange('prev')}
                  disabled={!canGoPrevMonth}
                  className="p-2 rounded-full transition-colors cursor-pointer bg-white/5 hover:bg-white/10 disabled:opacity-30"
                  aria-label="Previous month"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleMonthChange('next')}
                  disabled={!canGoNextMonth}
                  className="p-2 rounded-full transition-colors cursor-pointer bg-white/5 hover:bg-white/10 disabled:opacity-30"
                  aria-label="Next month"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid: Day Selection */}
        <div className="p-6 border-b border-white/10">
          <div className="flex flex-wrap gap-2 justify-center">
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
                    className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-lg font-semibold transition-all cursor-pointer hover:ring-2 hover:ring-white/50
                      ${isSelected ? 'text-white bg-blue-500' : 'bg-white/5'}
                      ${isCurrentDay && !isSelected ? 'border-2 border-blue-400/50' : 'border border-white/20'}
                    `}
                    aria-label={`Select day ${format(day, 'd MMMM')}`}
                  >
                    <span className="text-xs text-white/50">{format(day, 'E')}</span>
                    <span className="text-xl">{format(day, 'd')}</span>
                    {hasLog && !isSelected && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full"></div>
                    )}
                  </button>
                );
              })
            ) : (
              <p className="col-span-full text-center text-white/50">
                No days in view for this goal&apos;s period.
              </p>
            )}
          </div>
        </div>

        {/* Session List for Selected Day */}
        <div className="min-h-[250px] p-6">
          <h4 className="mb-4 text-xl font-bold text-white/80">
            {selectedDay
              ? `Logs for ${format(selectedDay, 'MMMM d, yyyy')}`
              : 'Select a day to view logs'}
          </h4>
          {selectedDay &&
            (selectedDaySessions.length > 0 ? (
              <ul className="space-y-3">
                {selectedDaySessions.map(session => {
                  const isEditing = editingSessionId === session.id; // Use session.id
                  const isCurrentlySaving = isUpdatingId === session.id; // Use session.id
                  return (
                    <li
                      key={session.id} // Use session.id as key
                      className="flex flex-col p-4 rounded-lg sm:flex-row sm:justify-between sm:items-center bg-white/5"
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
                            className="flex-1 py-1 text-base text-white bg-transparent border-b-2 cursor-pointer outline-none border-white/20 focus:border-blue-400 disabled:opacity-50"
                            aria-label="Edit session label"
                          />
                          <button
                            onClick={() => handleSaveUpdate(session)}
                            disabled={isCurrentlySaving || !editText.trim()} // Disable if empty
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
                          <p className="font-semibold text-white">{session.label}</p>
                          <p className="text-sm text-white/60">
                            Logged at {format(session.startTime.toDate(), 'h:mm a')}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2 items-center self-end sm:self-center">
                        <div className="flex gap-2 items-center px-3 py-1 font-mono text-sm text-cyan-300 rounded-full bg-cyan-500/10">
                          <FiClock size={14} />
                          {formatDuration(session.duration)}{' '}
                          {/* Changed from durationMs to duration */}
                        </div>
                        {!isEditing && (
                          <button
                            onClick={() => handleStartEditing(session)}
                            className="p-2 rounded-full transition-colors cursor-pointer text-white/60 hover:text-white hover:bg-white/10"
                            aria-label="Edit session"
                          >
                            <FiEdit />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            // Pass activeGoalId, dateKey, and sessionId for deletion
                            onDeleteSession(
                              activeGoalId!, // Assert non-null because of initial check
                              format(selectedDay, 'yyyy-MM-dd'),
                              session.id
                            )
                          }
                          disabled={isCurrentlySaving} // Disable delete while saving
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
              <div className="flex flex-col justify-center items-center pt-10 h-full text-center text-white/50">
                <FiClock size={32} className="mb-4" />
                <p>No focus sessions logged on this day.</p>
              </div>
            ))}
        </div>

        {/* Footer: Goal Dates and Daily Total */}
        <div className="flex flex-col gap-4 justify-between items-center p-4 text-sm border-t sm:flex-row border-white/10 text-white/60">
          <div className="flex flex-wrap gap-y-2 gap-x-4 items-center">
            {' '}
            {/* Use flex-wrap for small screens */}
            {goalStartDate && (
              <div className="flex gap-2 items-center" title="Goal Start Date">
                <FiPlayCircle className="text-green-400" />
                <span>Start: {format(goalStartDate, 'd MMM, yyyy')}</span> {/* Added yyyy */}
              </div>
            )}
            {goalEndDate && (
              <div className="flex gap-2 items-center" title="Goal End Date">
                <FiFlag className="text-red-400" />
                <span>End: {format(goalEndDate, 'd MMM, yyyy')}</span> {/* Added yyyy */}
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
