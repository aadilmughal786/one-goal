// app/components/stopwatch/SessionLog.tsx
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppState, StopwatchSession } from '@/types'; // Import DailyProgress and StopwatchSession
import {
  FiActivity,
  FiClock,
  FiTrash2,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiPlayCircle,
  FiFlag,
} from 'react-icons/fi';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { isToday, isYesterday, format, addDays, subDays, startOfDay, parseISO } from 'date-fns'; // Import parseISO

interface SessionLogProps {
  appState: AppState | null;
  // Updated onDeleteSession to match firebaseService signature
  onDeleteSession: (
    dateKey: string,
    sessionStartTime: StopwatchSession['startTime']
  ) => Promise<void>;
}

export default function SessionLog({ appState, onDeleteSession }: SessionLogProps) {
  const [selectedDay, setSelectedDay] = useState<Date>(new Date()); // Initialize with Date object directly
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const calendarRef = useRef<HTMLDivElement>(null);

  // Effect to determine the initial selected day based on the most recent logged session
  useEffect(() => {
    let mostRecentDate: Date | null = null;
    if (appState?.dailyProgress) {
      // Iterate through dailyProgress entries to find the latest date with sessions
      for (const dateKey of Object.keys(appState.dailyProgress).sort().reverse()) {
        const dailyProgressEntry = appState.dailyProgress[dateKey];
        if (
          dailyProgressEntry.stopwatchSessions &&
          dailyProgressEntry.stopwatchSessions.length > 0
        ) {
          mostRecentDate = parseISO(dateKey); // Convert date string to Date object
          break;
        }
      }
    }
    const initialDate = mostRecentDate || new Date();
    setSelectedDay(initialDate);
    setCalendarMonth(initialDate);
  }, [appState?.dailyProgress]); // Depend on dailyProgress changes

  // Effect to close the calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [calendarRef]);

  // Helper function to format duration from milliseconds to a readable string
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

  // Helper function to format the display date (Today, Yesterday, or full date)
  const formatDisplayDate = (date: Date): string => {
    // Changed type to Date (non-optional)
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy'); // Corrected format string for year
  };

  // Memoized list of days that have logged sessions, for calendar highlighting
  const loggedDays = useMemo(() => {
    const daysWithLogs = new Set<string>();
    if (appState?.dailyProgress) {
      for (const dateKey in appState.dailyProgress) {
        if (Object.prototype.hasOwnProperty.call(appState.dailyProgress, dateKey)) {
          const dailyProgressEntry = appState.dailyProgress[dateKey];
          if (
            dailyProgressEntry.stopwatchSessions &&
            dailyProgressEntry.stopwatchSessions.length > 0
          ) {
            daysWithLogs.add(dateKey);
          }
        }
      }
    }
    // Convert date strings back to Date objects for DayPicker modifiers
    return Array.from(daysWithLogs).map(dateStr => parseISO(dateStr));
  }, [appState?.dailyProgress]);

  // Memoized list of stopwatch sessions for the currently selected day
  const filteredSessions = useMemo(() => {
    if (!selectedDay || !appState?.dailyProgress) return [];

    const selectedDateStr = format(selectedDay, 'yyyy-MM-dd');
    const dailyProgressEntry = appState.dailyProgress[selectedDateStr];

    if (dailyProgressEntry && dailyProgressEntry.stopwatchSessions) {
      // Sort sessions by startTime (descending)
      return [...dailyProgressEntry.stopwatchSessions].sort(
        (a, b) => b.startTime.toDate().getTime() - a.startTime.toDate().getTime()
      );
    }
    return [];
  }, [appState?.dailyProgress, selectedDay]);

  // Memoized total time spent for the currently filtered sessions
  const totalFilteredTime = useMemo(() => {
    return filteredSessions.reduce((total, session) => total + session.durationMs, 0);
  }, [filteredSessions]);

  // Get goal start and end dates from appState.goal
  const goalStartDate = appState?.goal?.createdAt?.toDate(); // Use createdAt
  const goalEndDate = appState?.goal?.endDate?.toDate();

  // Navigation for previous/next day in the calendar view
  const navigateDay = (direction: 'prev' | 'next') => {
    if (!selectedDay || !goalStartDate || !goalEndDate) return;

    const newDay = direction === 'prev' ? subDays(selectedDay, 1) : addDays(selectedDay, 1);

    // Ensure newDay is within the goal's start and end dates
    if (
      startOfDay(newDay) >= startOfDay(goalStartDate) &&
      startOfDay(newDay) <= startOfDay(goalEndDate)
    ) {
      setSelectedDay(newDay);
      setCalendarMonth(newDay);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-3xl">
      <div className="mb-8 text-center">
        <h3 className="flex gap-3 justify-center items-center text-2xl font-bold">
          <FiActivity />
          Focus Session Log
        </h3>
        <p className="mt-2 text-white/60">
          Review your logged focus sessions. Days with logged entries are marked.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-sm">
        <div className="flex justify-between items-center p-6 border-b border-white/20">
          <h4 className="text-lg font-bold text-white">{formatDisplayDate(selectedDay)}</h4>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <button
                onClick={() => setIsCalendarOpen(prev => !prev)}
                className="p-2 rounded-lg transition-colors text-white/80 hover:bg-white/10 hover:text-white"
                aria-label="Select date"
              >
                <FiCalendar size={20} />
              </button>
              {isCalendarOpen && (
                <div ref={calendarRef} className="absolute right-0 top-full z-20 mt-2">
                  <div className="p-4 rounded-2xl border shadow-lg border-white/20 bg-neutral-900">
                    {appState?.goal ? (
                      <DayPicker
                        mode="single"
                        selected={selectedDay}
                        onSelect={day => {
                          if (day) setSelectedDay(day);
                          setIsCalendarOpen(false);
                        }}
                        month={calendarMonth}
                        onMonthChange={setCalendarMonth}
                        modifiers={{
                          logged: loggedDays,
                          disabled: date => {
                            // Disable dates outside the goal range if goal exists
                            if (!goalStartDate || !goalEndDate) return false;
                            return (
                              date < startOfDay(goalStartDate) || date > startOfDay(goalEndDate)
                            );
                          },
                        }}
                        modifiersClassNames={{ logged: 'day-with-log' }}
                        className="text-white"
                      />
                    ) : (
                      <div className="p-8 text-center text-white/50">
                        Set a goal to enable the calendar.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mx-1 w-px h-6 bg-white/20"></div>

            <div className="flex gap-2 items-center">
              <button
                onClick={() => navigateDay('prev')}
                disabled={
                  !selectedDay ||
                  !goalStartDate ||
                  startOfDay(selectedDay) <= startOfDay(goalStartDate)
                }
                className="p-2 rounded-full transition-colors bg-white/5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <FiChevronLeft />
              </button>
              <button
                onClick={() => navigateDay('next')}
                disabled={
                  !selectedDay || !goalEndDate || startOfDay(selectedDay) >= startOfDay(goalEndDate)
                }
                className="p-2 rounded-full transition-colors bg-white/5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-[240px] p-6">
          {filteredSessions.length > 0 ? (
            <ul className="space-y-3">
              {filteredSessions.map(session => (
                <li
                  key={session.startTime.toMillis()} // Use toMillis for a unique key from Timestamp
                  className="flex justify-between items-center p-3 rounded-lg transition-colors group bg-white/5 hover:bg-white/10"
                >
                  <div>
                    <p className="font-semibold text-white">{session.label}</p>
                    <p className="text-sm text-white/60">
                      {session.startTime // Use startTime to display time
                        .toDate()
                        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="flex gap-2 items-center px-3 py-1 font-mono text-sm text-cyan-300 rounded-full bg-cyan-500/10">
                      <FiClock size={14} />
                      {formatDuration(session.durationMs)}
                    </div>
                    <button
                      onClick={() =>
                        onDeleteSession(format(selectedDay, 'yyyy-MM-dd'), session.startTime)
                      } // Pass dateKey and session.startTime
                      className="p-2 opacity-0 transition-all text-red-400/70 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                      aria-label="Delete session"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col justify-center items-center pt-10 h-full text-center text-white/50">
              <FiClock size={32} className="mb-4" />
              <p>No focus sessions logged for this date.</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-4 text-xs border-t border-white/20 bg-black/20 text-white/60">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1.5">
              <FiPlayCircle className="text-green-400" />
              <span>Start: {goalStartDate ? format(goalStartDate, 'd MMM yy') : '...'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FiFlag className="text-red-400" />
              <span>End: {goalEndDate ? format(goalEndDate, 'd MMM yy') : '...'}</span>
            </div>
          </div>
          <div className="px-3 py-1 text-sm font-semibold text-green-300 rounded-full bg-green-500/10">
            Total: {formatDuration(totalFilteredTime)}
          </div>
        </div>
      </div>
    </div>
  );
}
