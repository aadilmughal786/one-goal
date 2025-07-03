// app/components/dashboard/ProgressCalendar.tsx
'use client';

import {
  DailyProgress,
  Goal,
  RoutineLogStatus,
  RoutineType,
  SatisfactionLevel,
  StopwatchSession,
} from '@/types';
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
import React, { useCallback, useMemo, useState } from 'react';
import { FaTooth } from 'react-icons/fa6';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import {
  MdOutlineDirectionsRun,
  MdOutlineNightlight,
  MdOutlineRestaurant,
  MdOutlineShower,
  MdOutlineWaterDrop,
} from 'react-icons/md';

interface ProgressCalendarProps {
  goal: Goal;
  dailyProgress: Record<string, DailyProgress>;
  onDayClick: (date: Date) => void;
}

const routineIcons = {
  [RoutineType.SLEEP]: MdOutlineNightlight,
  [RoutineType.WATER]: MdOutlineWaterDrop,
  [RoutineType.EXERCISE]: MdOutlineDirectionsRun,
  [RoutineType.MEAL]: MdOutlineRestaurant,
  [RoutineType.TEETH]: FaTooth,
  [RoutineType.BATH]: MdOutlineShower,
};

const getSatisfactionInfo = (
  level: SatisfactionLevel | null | undefined
): { bgColor: string; textColor: string; label: string } => {
  const infoMap: Record<SatisfactionLevel, { bgColor: string; textColor: string; label: string }> =
    {
      [SatisfactionLevel.VERY_UNSATISFIED]: {
        bgColor: 'bg-red-500/50',
        textColor: 'text-red-400',
        label: 'Very Unsatisfied',
      },
      [SatisfactionLevel.UNSATISFIED]: {
        bgColor: 'bg-orange-500/50',
        textColor: 'text-orange-400',
        label: 'Unsatisfied',
      },
      [SatisfactionLevel.NEUTRAL]: {
        bgColor: 'bg-yellow-500/50',
        textColor: 'text-yellow-400',
        label: 'Neutral',
      },
      [SatisfactionLevel.SATISFIED]: {
        bgColor: 'bg-lime-500/50',
        textColor: 'text-lime-400',
        label: 'Satisfied',
      },
      [SatisfactionLevel.VERY_SATISFIED]: {
        bgColor: 'bg-green-500/50',
        textColor: 'text-green-400',
        label: 'Very Satisfied',
      },
    };
  if (level === null || level === undefined) {
    return { bgColor: 'bg-bg-tertiary', textColor: 'text-text-tertiary', label: 'Not Logged' };
  }
  return infoMap[level];
};

const legendItems = [
  { level: SatisfactionLevel.VERY_SATISFIED, label: 'Very Satisfied' },
  { level: SatisfactionLevel.SATISFIED, label: 'Satisfied' },
  { level: SatisfactionLevel.NEUTRAL, label: 'Neutral' },
  { level: SatisfactionLevel.UNSATISFIED, label: 'Unsatisfied' },
  { level: SatisfactionLevel.VERY_UNSATISFIED, label: 'Very Unsatisfied' },
  { level: null, label: 'Not Logged' },
];

const ProgressCalendar: React.FC<ProgressCalendarProps> = ({ goal, dailyProgress, onDayClick }) => {
  const goalStartDate = goal.startDate.toDate();
  const goalEndDate = goal.endDate.toDate();

  const getInitialMonth = () => {
    const today = new Date();
    if (isWithinInterval(today, { start: goalStartDate, end: goalEndDate })) {
      return startOfMonth(today);
    }
    return startOfMonth(goalStartDate);
  };

  const [currentMonth, setCurrentMonth] = useState(getInitialMonth);

  const progressMap = useMemo(() => {
    return dailyProgress;
  }, [dailyProgress]);

  const goalDays = useMemo(() => {
    return eachDayOfInterval({ start: goalStartDate, end: goalEndDate });
  }, [goalStartDate, goalEndDate]);

  const daysInView = useMemo(() => {
    const monthInterval = { start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) };
    return goalDays.filter(day => isWithinInterval(day, monthInterval));
  }, [currentMonth, goalDays]);

  const canGoToPrevMonth = !isSameMonth(currentMonth, startOfMonth(goalStartDate));
  const canGoToNextMonth = !isSameMonth(currentMonth, endOfMonth(goalEndDate));

  const handlePrevMonth = useCallback(() => {
    if (canGoToPrevMonth) setCurrentMonth(prev => subMonths(prev, 1));
  }, [canGoToPrevMonth]);

  const handleNextMonth = useCallback(() => {
    if (canGoToNextMonth) setCurrentMonth(prev => addMonths(prev, 1));
  }, [canGoToNextMonth]);

  const handleTodayClick = useCallback(() => {
    const today = new Date();
    if (isWithinInterval(today, { start: goalStartDate, end: goalEndDate })) {
      setCurrentMonth(startOfMonth(today));
    }
  }, [goalStartDate, goalEndDate]);

  const isTodayButtonClickable = useMemo(() => {
    const today = new Date();
    return isWithinInterval(today, { start: goalStartDate, end: goalEndDate });
  }, [goalStartDate, goalEndDate]);

  const isFutureDate = useCallback(
    (date: Date) => endOfDay(date).getTime() > endOfDay(new Date()).getTime(),
    []
  );

  const getTotalSessionMinutes = useCallback((sessions: StopwatchSession[] | undefined): number => {
    return (sessions || []).reduce((sum, s) => sum + s.duration, 0) / (1000 * 60);
  }, []);

  return (
    <div className="card">
      <div className="rounded-3xl">
        <div className="flex justify-between items-center p-4 border-b sm:p-6 border-border-primary">
          <h3 className="text-xl font-bold text-text-primary">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleTodayClick}
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

        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {daysInView.length > 0 ? (
              daysInView.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const progress = progressMap[dateKey];
                const isFuture = isFutureDate(day);
                const isClickable = !isFuture;

                const satisfactionInfo = getSatisfactionInfo(progress?.satisfaction);
                let dayClasses = `relative group flex flex-col items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg transition-all duration-200 ${satisfactionInfo.bgColor}`;

                if (isClickable) {
                  dayClasses += ' cursor-pointer hover:ring-2 ring-border-accent';
                } else {
                  dayClasses += ' opacity-50';
                }
                if (isToday(day)) {
                  dayClasses += ' border-2 border-border-accent';
                }

                return (
                  <div
                    key={dateKey}
                    className={dayClasses}
                    onClick={() => isClickable && onDayClick(day)}
                    aria-label={`Progress for ${format(day, 'MMMM d')}`}
                  >
                    <span className="text-xs text-text-tertiary">{format(day, 'E')}</span>
                    <span className="z-10 text-lg font-bold text-text-primary sm:text-xl">
                      {format(day, 'd')}
                    </span>

                    {progress && (
                      <div className="absolute bottom-full left-1/2 invisible z-50 mb-2 w-max max-w-xs text-left rounded-lg border shadow-xl opacity-0 transition-opacity duration-300 -translate-x-1/2 bg-bg-tertiary border-border-primary group-hover:opacity-100 group-hover:visible">
                        <p className="p-3 pb-1 text-sm font-bold text-text-primary">
                          {format(new Date(progress.date), 'MMMM d, yyyy')}
                        </p>
                        <hr className="my-1 border-border-primary" />
                        <div className="px-3 py-1 space-y-1">
                          <p className="text-xs">
                            <span className="font-semibold">Satisfaction:</span>{' '}
                            <span className={satisfactionInfo.textColor}>
                              {satisfactionInfo.label}
                            </span>
                          </p>
                          <p className="text-xs">
                            <span className="font-semibold">Time Spent:</span>{' '}
                            {getTotalSessionMinutes(progress.sessions).toFixed(0)} mins
                          </p>
                          {progress.notes && (
                            <p className="mt-1 text-xs italic text-text-secondary">
                              {progress.notes}
                            </p>
                          )}
                        </div>
                        {progress.routines &&
                          Object.values(progress.routines).some(
                            s => s !== RoutineLogStatus.NOT_LOGGED
                          ) && (
                            <div className="px-3 pt-2 pb-3 mt-1 border-t border-border-primary">
                              <p className="mb-2 text-xs font-semibold text-text-primary">
                                Routine Status
                              </p>
                              <div className="flex flex-wrap gap-3">
                                {Object.entries(progress.routines).map(([key, value]) => {
                                  const Icon = routineIcons[key as RoutineType];
                                  if (!Icon) return null;

                                  let statusClass = 'text-gray-500';
                                  let title = `${key.charAt(0).toUpperCase() + key.slice(1)}: Not Logged`;

                                  if (value === RoutineLogStatus.DONE) {
                                    statusClass = 'text-green-400';
                                    title = `${key.charAt(0).toUpperCase() + key.slice(1)}: Done`;
                                  } else if (value === RoutineLogStatus.SKIPPED) {
                                    statusClass = 'text-red-400';
                                    title = `${key.charAt(0).toUpperCase() + key.slice(1)}: Skipped`;
                                  }

                                  return (
                                    <div key={key} title={title}>
                                      <Icon className={`w-5 h-5 ${statusClass}`} />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        <div className="absolute bottom-0 left-1/2 w-3 h-3 border-r border-b rotate-45 -translate-x-1/2 translate-y-1/2 bg-bg-tertiary border-border-primary"></div>
                      </div>
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

        <div className="flex flex-wrap gap-y-2 gap-x-4 justify-center p-4 text-sm border-t border-border-primary text-text-secondary">
          {legendItems.map(item => {
            const { bgColor: color, label } = getSatisfactionInfo(item.level);
            return (
              <div key={item.label} className="flex gap-2 items-center">
                <span className={`w-4 h-4 rounded-md ${color}`}></span>
                <span>{label}</span>
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

export default ProgressCalendar;
