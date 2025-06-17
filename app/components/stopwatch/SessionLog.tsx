// app/components/stopwatch/SessionLog.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { AppState, StopwatchSession } from '@/types';
import {
  FiActivity,
  FiClock,
  FiTrash2,
  FiEdit,
  FiSave,
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  startOfDay,
  endOfDay,
  isWithinInterval,
  getDaysInMonth,
} from 'date-fns';

interface SessionLogProps {
  appState: AppState | null;
  onDeleteSession: (
    dateKey: string,
    sessionStartTime: StopwatchSession['startTime']
  ) => Promise<void>;
  onUpdateSession: (
    dateKey: string,
    sessionStartTime: StopwatchSession['startTime'],
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
  const goalEndDate = appState?.goal?.endDate?.toDate();

  const [currentMonth, setCurrentMonth] = useState(goalStartDate || new Date());
  const [selectedDay, setSelectedDay] = useState(goalStartDate || new Date());
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Get days in current month that are within goal range
  const daysInCurrentMonth = useMemo(() => {
    if (!goalStartDate || !goalEndDate) return [];

    const daysInMonth = getDaysInMonth(currentMonth);
    const validDays = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

      if (
        isWithinInterval(currentDate, {
          start: startOfDay(goalStartDate),
          end: endOfDay(goalEndDate),
        })
      ) {
        validDays.push(currentDate);
      }
    }

    return validDays;
  }, [currentMonth, goalStartDate, goalEndDate]);

  // Check which days have logged sessions
  const daysWithLogs = useMemo(() => {
    const loggedDays = new Set<string>();
    if (!appState?.dailyProgress) return loggedDays;

    daysInCurrentMonth.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const daySessions = appState.dailyProgress[dateKey]?.stopwatchSessions;
      if (daySessions && daySessions.length > 0) {
        loggedDays.add(dateKey);
      }
    });

    return loggedDays;
  }, [appState?.dailyProgress, daysInCurrentMonth]);

  const selectedDaySessions = useMemo(() => {
    if (!selectedDay || !appState?.dailyProgress) return [];
    const dateKey = format(selectedDay, 'yyyy-MM-dd');
    return (
      appState.dailyProgress[dateKey]?.stopwatchSessions.sort(
        (a, b) => b.startTime.toMillis() - a.startTime.toMillis()
      ) || []
    );
  }, [selectedDay, appState?.dailyProgress]);

  // Check if we can navigate to previous/next month
  const canGoPrevMonth = useMemo(() => {
    if (!goalStartDate) return false;
    const prevMonth = subMonths(currentMonth, 1);
    const prevMonthEnd = endOfMonth(prevMonth);
    return prevMonthEnd >= startOfDay(goalStartDate);
  }, [currentMonth, goalStartDate]);

  const canGoNextMonth = useMemo(() => {
    if (!goalEndDate) return false;
    const nextMonth = addMonths(currentMonth, 1);
    const nextMonthStart = startOfMonth(nextMonth);
    return nextMonthStart <= endOfDay(goalEndDate);
  }, [currentMonth, goalEndDate]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    // Don't change selectedDay - keep the current selection
  };

  const formatDuration = (ms: number) => {
    if (ms === 0) return '0s';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(' ');
  };

  const handleStartEditing = (session: StopwatchSession) => {
    setEditingSessionId(session.startTime.toMillis().toString());
    setEditText(session.label);
  };

  const handleSaveUpdate = async (session: StopwatchSession) => {
    if (!editText.trim()) return;
    const dateKey = format(session.startTime.toDate(), 'yyyy-MM-dd');
    await onUpdateSession(dateKey, session.startTime, editText);
    setEditingSessionId(null);
    setEditText('');
  };

  return (
    <div className="mx-auto mt-12 max-w-4xl">
      <div className="mb-8 text-center">
        <h3 className="flex gap-3 justify-center items-center text-2xl font-bold">
          <FiActivity />
          Focus Session Log
        </h3>
        <p className="mt-2 text-white/60">
          Navigate through months and select a day to view your logged focus sessions.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-sm">
        {/* Month Navigation */}
        <div className="p-6 border-b border-white/20">
          <div className="flex justify-between items-center">
            <button
              onClick={() => handleMonthChange('prev')}
              disabled={!canGoPrevMonth}
              className="flex gap-2 items-center px-4 py-2 rounded-lg transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FiChevronLeft />
              Previous
            </button>
            <h4 className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h4>
            <button
              onClick={() => handleMonthChange('next')}
              disabled={!canGoNextMonth}
              className="flex gap-2 items-center px-4 py-2 rounded-lg transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <FiChevronRight />
            </button>
          </div>
        </div>

        {/* Days Grid */}
        <div className="p-6 border-b border-white/20">
          <h5 className="mb-4 text-lg font-semibold text-white/80">
            Days in {format(currentMonth, 'MMMM yyyy')}
          </h5>
          {daysInCurrentMonth.length > 0 ? (
            <div className="flex flex-wrap gap-3 justify-center">
              {daysInCurrentMonth.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const hasLog = daysWithLogs.has(dateKey);
                const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDay(day)}
                    className={`relative flex items-center justify-center w-12 h-12 rounded-lg font-semibold transition-all
                      hover:bg-white/10 hover:scale-105
                      ${
                        isSelected
                          ? 'text-white bg-blue-500 ring-2 ring-blue-300 shadow-lg'
                          : 'bg-white/5 text-white/90'
                      }
                      ${hasLog ? 'border-2 border-cyan-400/50' : 'border border-white/20'}
                    `}
                  >
                    {format(day, 'd')}
                    {hasLog && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-gray-900"></div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-white/50">
              <p>No days in this month are within your goal period.</p>
            </div>
          )}
        </div>

        {/* Session Logs */}
        <div className="min-h-[300px] p-6">
          <h4 className="mb-4 text-xl font-bold text-white/80">
            Logs for {format(selectedDay, 'MMMM d, yyyy')}
          </h4>
          {selectedDaySessions.length > 0 ? (
            <ul className="space-y-3">
              {selectedDaySessions.map(session => {
                const sessionId = session.startTime.toMillis().toString();
                const isEditing = editingSessionId === sessionId;
                const isUpdating = isUpdatingId === sessionId;
                return (
                  <li
                    key={sessionId}
                    className="flex justify-between items-center p-4 rounded-lg transition-colors bg-white/5 hover:bg-white/10"
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSaveUpdate(session)}
                        autoFocus
                        disabled={isUpdating}
                        className="flex-1 text-base text-white bg-transparent border-b-2 outline-none border-white/20 focus:border-blue-400 disabled:opacity-50"
                      />
                    ) : (
                      <div>
                        <p className="font-semibold text-white">{session.label}</p>
                        <p className="text-sm text-white/60">
                          {session.startTime
                            .toDate()
                            .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2 items-center">
                      <div className="flex gap-2 items-center px-3 py-1 font-mono text-sm text-cyan-300 rounded-full bg-cyan-500/10">
                        <FiClock size={14} />
                        {formatDuration(session.durationMs)}
                      </div>
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveUpdate(session)}
                          disabled={isUpdating}
                          className="p-2 text-green-400 rounded-full hover:bg-green-500/10 disabled:opacity-50"
                          aria-label="Save changes"
                        >
                          {isUpdating ? <FiLoader className="animate-spin" /> : <FiSave />}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartEditing(session)}
                          className="p-2 rounded-full text-white/60 hover:bg-white/10"
                          aria-label="Edit session"
                        >
                          <FiEdit />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          onDeleteSession(format(selectedDay, 'yyyy-MM-dd'), session.startTime)
                        }
                        className="p-2 rounded-full text-red-400/70 hover:bg-red-500/10"
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
              <p>No focus sessions logged for this day.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
