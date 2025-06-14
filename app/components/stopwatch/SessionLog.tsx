// app/components/stopwatch/SessionLog.tsx
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppState } from '@/types';
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
import { isToday, isYesterday, format, addDays, subDays, startOfDay } from 'date-fns';

interface SessionLogProps {
  appState: AppState | null;
  onDeleteSession: (sessionId: number) => void;
}

export default function SessionLog({ appState, onDeleteSession }: SessionLogProps) {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lastLoggedDay = appState?.stopwatchSessions
      ?.sort((a, b) => b.date.toMillis() - a.date.toMillis())[0]
      ?.date.toDate();
    const initialDate = lastLoggedDay || new Date();
    setSelectedDay(initialDate);
    setCalendarMonth(initialDate);
  }, [appState?.stopwatchSessions]);

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

  const formatDisplayDate = (date: Date | undefined): string => {
    if (!date) return 'Select a Date';
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const loggedDays = useMemo(() => {
    if (!appState?.stopwatchSessions) return [];
    const daysWithLogs = new Set<string>();
    appState.stopwatchSessions.forEach(session => {
      daysWithLogs.add(session.date.toDate().toISOString().split('T')[0]);
    });
    return Array.from(daysWithLogs).map(dateStr => new Date(`${dateStr}T00:00:00`));
  }, [appState?.stopwatchSessions]);

  const filteredSessions = useMemo(() => {
    if (!selectedDay) return [];

    const selectedDateStr = selectedDay.toISOString().split('T')[0];

    return (appState?.stopwatchSessions || [])
      .filter(session => {
        const sessionDateStr = session.date.toDate().toISOString().split('T')[0];
        return sessionDateStr === selectedDateStr;
      })
      .sort((a, b) => b.date.toMillis() - a.date.toMillis());
  }, [appState?.stopwatchSessions, selectedDay]);

  const totalFilteredTime = useMemo(() => {
    return filteredSessions.reduce((total, session) => total + session.durationMs, 0);
  }, [filteredSessions]);

  const goalStartDate = appState?.goal?.startDate.toDate();
  const goalEndDate = appState?.goal?.endDate.toDate();

  const navigateDay = (direction: 'prev' | 'next') => {
    if (!selectedDay || !goalStartDate || !goalEndDate) return;

    const newDay = direction === 'prev' ? subDays(selectedDay, 1) : addDays(selectedDay, 1);

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
                disabled={!selectedDay || startOfDay(selectedDay) <= startOfDay(goalStartDate!)}
                className="p-2 rounded-full transition-colors bg-white/5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <FiChevronLeft />
              </button>
              <button
                onClick={() => navigateDay('next')}
                disabled={!selectedDay || startOfDay(selectedDay) >= startOfDay(goalEndDate!)}
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
                  key={session.id}
                  className="flex justify-between items-center p-3 rounded-lg transition-colors group bg-white/5 hover:bg-white/10"
                >
                  <div>
                    <p className="font-semibold text-white">{session.label}</p>
                    <p className="text-sm text-white/60">
                      {session.date
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
                      onClick={() => onDeleteSession(session.id)}
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
