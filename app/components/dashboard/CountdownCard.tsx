// app/components/dashboard/CountdownCard.tsx
'use client';

import { Goal } from '@/types'; // Import Goal type
import { differenceInDays, eachDayOfInterval, format, isWeekend } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { FiChevronsRight, FiClock, FiFlag, FiPlayCircle } from 'react-icons/fi';

interface CountdownCardProps {
  goal: Goal; // Expects a Goal object
}

const CountdownCard: React.FC<CountdownCardProps> = ({ goal }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { timeLeft, progressPercent, totalDays, remainingDays, daysPassed, weekendDays } =
    useMemo(() => {
      const goalEndDate = goal.endDate.toDate();
      const goalStartDate = goal.startDate.toDate();
      const currentTime = now.getTime();

      const timeLeftMs = Math.max(0, goalEndDate.getTime() - currentTime);
      const totalDurationMs = Math.max(1, goalEndDate.getTime() - goalStartDate.getTime());
      const progressPercent = Math.min(
        100,
        ((currentTime - goalStartDate.getTime()) / totalDurationMs) * 100
      );

      const totalDays = differenceInDays(goalEndDate, goalStartDate) + 1;
      const currentDaysPassed = differenceInDays(now, goalStartDate);
      const remainingDays = differenceInDays(goalEndDate, now) + 1;

      const allDaysInGoal = eachDayOfInterval({ start: goalStartDate, end: goalEndDate });
      const weekendDays = allDaysInGoal.filter(day => isWeekend(day)).length;

      return {
        timeLeft: timeLeftMs,
        progressPercent,
        totalDays,
        remainingDays: Math.max(0, remainingDays),
        daysPassed: Math.max(0, currentDaysPassed),
        weekendDays,
      };
    }, [goal, now]);

  const days = String(Math.floor(timeLeft / (1000 * 60 * 60 * 24))).padStart(2, '0');
  const hours = String(Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(
    2,
    '0'
  );
  const minutes = String(Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
  const seconds = String(Math.floor((timeLeft % (1000 * 60)) / 1000)).padStart(2, '0');

  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 140;

  return (
    <div className="card">
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">{goal.name}</h2>
        {goal.description !== null && goal.description !== '' && (
          <p className="mt-2 text-text-secondary">{goal.description}</p>
        )}
      </div>

      <div className="flex flex-col gap-8 items-center md:flex-row">
        <div className="relative flex-shrink-0 w-48 h-48 sm:w-56 sm:h-56">
          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 300 300">
            <circle
              cx="150"
              cy="150"
              r="140"
              stroke="var(--color-border-primary)"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="150"
              cy="150"
              r="140"
              stroke="var(--color-text-primary)"
              strokeWidth="12"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={CIRCLE_CIRCUMFERENCE}
              strokeDashoffset={CIRCLE_CIRCUMFERENCE * (1 - progressPercent / 100)}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="flex absolute inset-0 flex-col justify-center items-center text-center">
            <span className="text-4xl font-bold text-text-primary sm:text-5xl">
              {Math.floor(progressPercent)}%
            </span>
            <p className="mt-1 text-sm text-text-secondary">Time Elapsed</p>
          </div>
        </div>

        <div className="flex flex-col w-full text-center md:text-left">
          <div className="flex gap-4 justify-center my-4 text-sm md:justify-start sm:gap-6 text-text-secondary">
            <div className="flex gap-2 items-center">
              <FiPlayCircle className="text-green-400" />
              <span>Start: {format(goal.startDate.toDate(), 'd MMM yy')}</span>
            </div>
            <div className="flex gap-2 items-center">
              <FiFlag className="text-red-400" />
              <span>End: {format(goal.endDate.toDate(), 'd MMM yy')}</span>
            </div>
          </div>

          <div className="flex gap-4 justify-center mb-4 text-sm md:justify-start sm:gap-6 text-text-secondary">
            <div className="flex gap-2 items-center">
              <FiChevronsRight size={18} className="text-yellow-400" />
              <span>
                days {daysPassed} out of {totalDays}
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <FiClock className="text-purple-400" />
              <span>{remainingDays} days left</span>
            </div>
            <div className="flex gap-2 items-center">
              <FiClock className="text-blue-400" />
              <span>{weekendDays} weekend days</span>
            </div>
          </div>

          <div className="mt-2">
            <p className="flex gap-2 justify-center items-center mb-2 text-sm md:justify-start text-text-tertiary">
              <FiClock /> Time Remaining
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="p-3 text-center rounded-lg bg-bg-tertiary">
                <span className="font-mono text-3xl font-bold tracking-wider text-text-primary sm:text-4xl">
                  {days}
                </span>
                <p className="text-xs text-text-muted">Days</p>
              </div>
              <div className="p-3 text-center rounded-lg bg-bg-tertiary">
                <span className="font-mono text-3xl font-bold tracking-wider text-text-primary sm:text-4xl">
                  {hours}
                </span>
                <p className="text-xs text-text-muted">Hours</p>
              </div>
              <div className="p-3 text-center rounded-lg bg-bg-tertiary">
                <span className="font-mono text-3xl font-bold tracking-wider text-text-primary sm:text-4xl">
                  {minutes}
                </span>
                <p className="text-xs text-text-muted">Mins</p>
              </div>
              <div className="p-3 text-center rounded-lg bg-bg-tertiary">
                <span className="font-mono text-3xl font-bold tracking-wider text-text-primary sm:text-4xl">
                  {seconds}
                </span>
                <p className="text-xs text-text-muted">Secs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownCard;
