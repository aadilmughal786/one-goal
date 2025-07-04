// app/components/routine/RoutineCalendar.tsx
'use client';

import { DailyProgress, RoutineLogStatus, RoutineType, SatisfactionLevel } from '@/types';
import { ServiceError } from '@/utils/errors';
import {
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  isWithinInterval,
  startOfMonth,
  subMonths,
} from 'date-fns';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiCheckCircle, FiChevronLeft, FiChevronRight, FiLoader, FiXCircle } from 'react-icons/fi';

import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useRoutineStore } from '@/store/useRoutineStore';

interface RoutineCalendarProps {
  routineType: RoutineType;
  title: string;
  icon: React.ElementType;
}

const CustomTooltip = ({
  date,
  dailyProgress,
  onToggle,
  isToggling,
  isFutureDate,
  routineType,
  isActive,
}: {
  date: Date;
  dailyProgress: DailyProgress | null;
  onToggle: (date: Date) => Promise<void>;
  isToggling: boolean;
  isFutureDate: boolean;
  routineType: RoutineType;
  isActive: boolean;
}) => {
  const logStatus = dailyProgress?.routines?.[routineType];
  const routineName = routineType.charAt(0).toUpperCase() + routineType.slice(1);

  let statusText: React.ReactNode;
  let buttonText: string;
  let ButtonIcon: React.ElementType;
  let buttonClass: string;

  if (logStatus === RoutineLogStatus.DONE) {
    statusText = <span className="text-green-400">Done</span>;
    buttonText = `Mark as Skipped`;
    ButtonIcon = FiXCircle;
    buttonClass = 'text-red-400 bg-red-500/20 hover:bg-red-500/30';
  } else if (logStatus === RoutineLogStatus.SKIPPED) {
    statusText = <span className="text-red-400">Skipped</span>;
    buttonText = `Mark as Not Logged`;
    ButtonIcon = FiCheckCircle;
    buttonClass = 'text-text-secondary bg-bg-tertiary hover:bg-border-primary';
  } else {
    statusText = <span className="text-text-tertiary">Not Logged</span>;
    buttonText = `Mark as Done`;
    ButtonIcon = FiCheckCircle;
    buttonClass = 'text-green-400 bg-green-500/20 hover:bg-green-500/30';
  }

  return (
    <div
      className={`absolute bottom-full left-1/2 invisible z-20 mb-2 w-max max-w-xs text-left rounded-lg border shadow-xl transition-opacity duration-300 -translate-x-1/2 bg-bg-primary border-border-primary group-hover:visible group-hover:opacity-100 cursor-default ${isActive ? '!visible opacity-100' : 'opacity-0'}`}
    >
      <p className="p-3 pb-1 font-bold text-text-primary">{format(date, 'MMMM d,yyyy')}</p>
      <hr className="my-1 border-border-primary" />
      <div className="px-3 py-2">
        <p className="text-sm">
          <span className="font-semibold">{routineName} Status:</span> {statusText}
        </p>
        <button
          onClick={() => onToggle(date)}
          disabled={isToggling || isFutureDate}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-200 cursor-pointer
            ${isFutureDate ? 'text-gray-400 bg-gray-700' : buttonClass} disabled:opacity-50`}
        >
          {isToggling ? <FiLoader className="animate-spin" size={16} /> : <ButtonIcon size={16} />}
          {isFutureDate ? 'Cannot Log' : buttonText}
        </button>
      </div>
      <div className="absolute bottom-0 left-1/2 w-3 h-3 border-r border-b rotate-45 -translate-x-1/2 translate-y-1/2 bg-bg-primary border-border-primary"></div>
    </div>
  );
};

const RoutineCalendar: React.FC<RoutineCalendarProps> = ({
  routineType,
  title,
  icon: IconComponent,
}) => {
  const { appState } = useGoalStore();
  const { saveDailyProgress } = useRoutineStore();
  const { showToast } = useNotificationStore();

  const activeGoal = appState?.goals[appState?.activeGoalId || ''];
  const goalStartDate = activeGoal?.startDate?.toDate();
  const goalEndDate = activeGoal?.endDate?.toDate();

  const [currentMonth, setCurrentMonth] = useState<Date>(
    goalStartDate ? startOfMonth(goalStartDate) : startOfMonth(new Date())
  );
  const [isToggling, setIsToggling] = useState(false);
  const [activeTooltipDay, setActiveTooltipDay] = useState<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setActiveTooltipDay(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goalDays = useMemo(() => {
    if (!goalStartDate || !goalEndDate) return [];
    return eachDayOfInterval({ start: goalStartDate, end: goalEndDate });
  }, [goalStartDate, goalEndDate]);

  const daysInView = useMemo(() => {
    if (!goalStartDate || !goalEndDate) return [];
    const monthInterval = { start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) };
    return goalDays.filter(day => isWithinInterval(day, monthInterval));
  }, [currentMonth, goalDays, goalEndDate, goalStartDate]);

  const canGoToPrevMonth = useMemo(
    () => goalStartDate && !isSameMonth(currentMonth, startOfMonth(goalStartDate)),
    [currentMonth, goalStartDate]
  );
  const canGoToNextMonth = useMemo(
    () => goalEndDate && !isSameMonth(currentMonth, endOfMonth(goalEndDate)),
    [currentMonth, goalEndDate]
  );

  const isTodayButtonClickable = useMemo(() => {
    if (!goalStartDate || !goalEndDate) return false;
    const today = new Date();
    return isWithinInterval(today, { start: goalStartDate, end: goalEndDate });
  }, [goalStartDate, goalEndDate]);

  const handlePrevMonth = useCallback(() => {
    if (canGoToPrevMonth) setCurrentMonth(prev => subMonths(prev, 1));
  }, [canGoToPrevMonth]);

  const handleNextMonth = useCallback(() => {
    if (canGoToNextMonth) setCurrentMonth(prev => addMonths(prev, 1));
  }, [canGoToNextMonth]);

  const handleGoToToday = useCallback(() => {
    if (isTodayButtonClickable) {
      setCurrentMonth(startOfMonth(new Date()));
    }
  }, [isTodayButtonClickable]);

  const handleDayClick = useCallback((dateKey: string) => {
    setActiveTooltipDay(prev => (prev === dateKey ? null : dateKey));
  }, []);

  const isFutureDate = useCallback(
    (date: Date) => endOfDay(date).getTime() > endOfDay(new Date()).getTime(),
    []
  );

  const handleToggleRoutineStatus = useCallback(
    async (date: Date) => {
      if (!activeGoal) {
        showToast('Active goal not found.', 'error');
        return;
      }
      if (isFutureDate(date)) {
        showToast('Cannot log routines for future dates.', 'info');
        return;
      }

      setIsToggling(true);
      const dateKey = format(date, 'yyyy-MM-dd');
      const existingDailyProgress = activeGoal.dailyProgress?.[dateKey];
      const currentStatus = existingDailyProgress?.routines?.[routineType];

      let newStatus: RoutineLogStatus;
      if (currentStatus === RoutineLogStatus.DONE) newStatus = RoutineLogStatus.SKIPPED;
      else if (currentStatus === RoutineLogStatus.SKIPPED) newStatus = RoutineLogStatus.NOT_LOGGED;
      else newStatus = RoutineLogStatus.DONE;

      const routinesForToday: Record<RoutineType, RoutineLogStatus> = {
        ...(existingDailyProgress?.routines || ({} as Record<RoutineType, RoutineLogStatus>)),
        [routineType]: newStatus,
      };

      const updatedProgress: DailyProgress = {
        date: dateKey,
        satisfaction: existingDailyProgress?.satisfaction || SatisfactionLevel.NEUTRAL,
        notes: existingDailyProgress?.notes || '',
        sessions: existingDailyProgress?.sessions || [],
        totalSessionDuration: existingDailyProgress?.totalSessionDuration || 0,
        routines: routinesForToday,
        weight: existingDailyProgress?.weight ?? null,
      };

      try {
        await saveDailyProgress(updatedProgress);
        showToast(`${title} status updated!`, 'success');
      } catch (error: unknown) {
        const errorMessage =
          error instanceof ServiceError ? error.message : 'An unknown error occurred.';
        console.error(`Error updating ${title} status:`, error);
        showToast(`Failed to update ${title} status: ${errorMessage}`, 'error');
      } finally {
        setIsToggling(false);
      }
    },
    [activeGoal, isFutureDate, routineType, showToast, title, saveDailyProgress]
  );

  const legendItems = [
    { status: RoutineLogStatus.DONE, label: 'Done', color: 'bg-green-500/50' },
    { status: RoutineLogStatus.SKIPPED, label: 'Skipped', color: 'bg-red-500/50' },
    { status: RoutineLogStatus.NOT_LOGGED, label: 'Not Logged', color: 'bg-bg-tertiary' },
  ];

  if (!activeGoal) {
    return (
      <div className="p-10 text-center text-text-secondary">
        <IconComponent className="mx-auto mb-4 text-4xl" />
        <p>Set an active goal to start tracking your {title.toLowerCase()} in the calendar.</p>
      </div>
    );
  }

  return (
    <div
      ref={calendarRef}
      className="rounded-3xl border shadow-2xl bg-bg-secondary border-border-primary"
    >
      <div className="px-4 sm:px-6">
        <div className="flex justify-between items-center py-4 sm:py-6">
          <h3 className="flex gap-2 items-center text-lg font-bold text-text-primary sm:text-xl">
            <IconComponent />
            {title}
          </h3>
          <div className="text-lg font-semibold text-center text-text-primary">
            {format(currentMonth, 'MMMM<x_bin_615>')}
          </div>
          <div className="flex gap-2 items-center">
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
                onClick={handlePrevMonth}
                disabled={!canGoToPrevMonth}
                className="p-2 rounded-full transition-colors cursor-pointer bg-bg-tertiary text-text-secondary hover:bg-border-primary disabled:opacity-30"
                aria-label="Previous month"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMonth}
                disabled={!canGoToNextMonth}
                className="p-2 rounded-full transition-colors cursor-pointer bg-bg-tertiary text-text-secondary hover:bg-border-primary disabled:opacity-30"
                aria-label="Next month"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border-primary"></div>

      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {daysInView.length > 0 ? (
            daysInView.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const logStatus = activeGoal.dailyProgress?.[dateKey]?.routines?.[routineType];
              const isCurrentDay = isToday(day);
              const isFuture = isFutureDate(day);

              let dayClasses =
                'relative group flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-lg transition-all duration-200 ';

              if (logStatus === RoutineLogStatus.DONE) dayClasses += 'bg-green-500/50';
              else if (logStatus === RoutineLogStatus.SKIPPED) dayClasses += 'bg-red-500/50';
              else dayClasses += 'bg-bg-tertiary';

              if (isCurrentDay) dayClasses += ' border-2 border-border-accent';
              if (isFuture) dayClasses += ' bg-gray-800/20 text-gray-500 opacity-50 ';
              else dayClasses += ' cursor-pointer hover:ring-2 hover:ring-border-accent';

              return (
                <div
                  key={dateKey}
                  className={dayClasses}
                  onMouseEnter={() => setActiveTooltipDay(null)}
                  onClick={e => {
                    e.stopPropagation();
                    if (!isFuture) handleDayClick(dateKey);
                  }}
                  aria-label={`${format(day, 'MMMM d')}, Status: ${logStatus === RoutineLogStatus.DONE ? 'Done' : logStatus === RoutineLogStatus.SKIPPED ? 'Skipped' : 'Not Logged'}`}
                >
                  <span className="text-xs text-text-tertiary">{format(day, 'E')}</span>
                  <span className="z-10 text-xl font-bold text-text-primary">
                    {format(day, 'd')}
                  </span>
                  {!isFuture && (
                    <CustomTooltip
                      date={day}
                      dailyProgress={activeGoal.dailyProgress?.[dateKey] || null}
                      onToggle={handleToggleRoutineStatus}
                      isToggling={isToggling}
                      isFutureDate={isFuture}
                      routineType={routineType}
                      isActive={activeTooltipDay === dateKey}
                    />
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-10 w-full text-center text-text-muted">
              No goal days in this month.
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border-primary"></div>

      <div className="p-4">
        <div className="flex flex-wrap gap-y-2 gap-x-4 justify-center text-sm text-text-secondary">
          {legendItems.map(item => {
            return (
              <div key={item.label} className="flex gap-2 items-center">
                <span className={`w-4 h-4 rounded-md ${item.color || item.color}`}></span>
                <span>{item.label}</span>
              </div>
            );
          })}
          <div className="flex gap-2 items-center">
            <span className="w-4 h-4 rounded-md border-2 border-border-accent"></span>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutineCalendar;
