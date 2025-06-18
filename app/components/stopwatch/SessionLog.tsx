// app/components/stopwatch/SessionLog.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { AppState, StopwatchSession } from '@/types';
import {
  FiActivity,
  FiClock,
  FiTrash2,
  FiEdit,
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiPlayCircle,
  FiFlag,
} from 'react-icons/fi';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameDay,
  eachDayOfInterval,
  max,
  min,
  isSameMonth,
  isToday,
} from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface SessionLogProps {
  appState: AppState | null;
  onDeleteSession: (dateKey: string, sessionStartTime: Timestamp) => Promise<void>;
  onUpdateSession: (
    dateKey: string,
    sessionStartTime: Timestamp,
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
  const goalStartDate = appState?.goal?.startDate?.toDate();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const loggedDays = useMemo(() => {
    return new Set(
      Object.values(appState?.dailyProgress || {})
        .filter(dp => dp.stopwatchSessions && dp.stopwatchSessions.length > 0)
        .map(dp => dp.date)
    );
  }, [appState?.dailyProgress]);

  const daysInView = useMemo(() => {
    if (!goalStartDate || !appState?.goal?.endDate) return [];
    const goalEndDate = appState.goal.endDate.toDate();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const viewStart = max([goalStartDate, monthStart]);
    const viewEnd = min([goalEndDate, monthEnd]);
    if (viewStart > viewEnd) return [];
    return eachDayOfInterval({ start: viewStart, end: viewEnd });
  }, [currentMonth, goalStartDate, appState?.goal?.endDate]);

  const selectedDaySessions = useMemo(() => {
    if (!selectedDay || !appState?.dailyProgress) return [];
    const dateKey = format(selectedDay, 'yyyy-MM-dd');
    const sessions = appState.dailyProgress[dateKey]?.stopwatchSessions || [];
    // Sort sessions by start time, most recent first
    return [...sessions].sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis());
  }, [selectedDay, appState?.dailyProgress]);

  // Calculate total time ONLY for the selected day
  const selectedDayTotalTime = useMemo(() => {
    if (!selectedDaySessions || selectedDaySessions.length === 0) return 0;
    return selectedDaySessions.reduce((total, session) => total + session.durationMs, 0);
  }, [selectedDaySessions]);

  const canGoPrevMonth = useMemo(() => {
    if (!goalStartDate) return false;
    return !isSameMonth(currentMonth, startOfMonth(goalStartDate));
  }, [currentMonth, goalStartDate]);

  const canGoNextMonth = useMemo(() => {
    if (!appState?.goal?.endDate) return false;
    const goalEndDate = appState.goal.endDate.toDate();
    return !isSameMonth(currentMonth, endOfMonth(goalEndDate));
  }, [currentMonth, appState?.goal?.endDate]);

  const handleMonthChange = useCallback(
    (direction: 'prev' | 'next') => {
      const newMonth =
        direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1);
      setCurrentMonth(newMonth);
    },
    [currentMonth]
  );

  const handleGoToToday = () => {
    const today = new Date();
    // Check if today is within the goal range before jumping
    if (
      goalStartDate &&
      appState?.goal?.endDate &&
      isSameDay(today, appState.goal.endDate.toDate())
    ) {
      setCurrentMonth(startOfMonth(today));
      setSelectedDay(today);
    } else {
      // Fallback to simply setting the view to today's month if not in goal range
      setCurrentMonth(startOfMonth(today));
      setSelectedDay(today);
    }
  };

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
    setEditingSessionId(session.startTime.toMillis().toString());
    setEditText(session.label);
  };

  const handleSaveUpdate = async (session: StopwatchSession) => {
    if (!editText.trim() || !selectedDay) return;
    const dateKey = format(selectedDay, 'yyyy-MM-dd');
    await onUpdateSession(dateKey, session.startTime, editText);
    setEditingSessionId(null);
    setEditText('');
  };

  return (
    <div className="mx-auto mt-12 max-w-4xl">
      <div className="mb-8 text-center">
        <h3 className="flex gap-3 justify-center items-center text-2xl font-bold">
          <FiActivity /> Focus Session Log
        </h3>
        <p className="mt-2 text-white/60">
          Review your tracked work sessions. Select a day to see the details.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-sm">
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h4 className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h4>
            <div className="flex gap-4 items-center">
              <button
                onClick={handleGoToToday}
                className="px-3 py-1 text-sm text-white rounded-md border transition-colors cursor-pointer bg-white/10 border-white/20 hover:bg-white/20"
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

        <div className="p-6 border-b border-white/10">
          <div className="flex flex-wrap gap-2 justify-center">
            {daysInView.map(day => {
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
                >
                  <span className="text-xs text-white/50">{format(day, 'E')}</span>
                  <span className="text-xl">{format(day, 'd')}</span>
                  {hasLog && !isSelected && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-[250px] p-6">
          <h4 className="mb-4 text-xl font-bold text-white/80">
            {selectedDay
              ? `Logs for ${format(selectedDay, 'MMMM d,yyyy')}`
              : 'Select a day to view logs'}
          </h4>
          {selectedDay &&
            (selectedDaySessions.length > 0 ? (
              <ul className="space-y-3">
                {selectedDaySessions.map(session => {
                  const sessionId = session.startTime.toMillis().toString();
                  const isEditing = editingSessionId === sessionId;
                  const isCurrentlySaving = isUpdatingId === sessionId;
                  return (
                    <li
                      key={sessionId}
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
                          />
                          <button
                            onClick={() => handleSaveUpdate(session)}
                            disabled={isCurrentlySaving}
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
                          {formatDuration(session.durationMs)}
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
                            onDeleteSession(format(selectedDay, 'yyyy-MM-dd'), session.startTime)
                          }
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

        <div className="flex flex-col gap-4 justify-between items-center p-4 text-sm border-t sm:flex-row border-white/10 text-white/60">
          <div className="flex gap-4 items-center">
            {goalStartDate && (
              <div className="flex gap-2 items-center" title="Goal Start Date">
                <FiPlayCircle className="text-green-400" />
                <span>Start: {format(goalStartDate, 'd MMM, yyyy')}</span>
              </div>
            )}
            {appState?.goal?.endDate && (
              <div className="flex gap-2 items-center" title="Goal End Date">
                <FiFlag className="text-red-400" />
                <span>End: {format(appState.goal.endDate.toDate(), 'd MMM, yyyy')}</span>
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
