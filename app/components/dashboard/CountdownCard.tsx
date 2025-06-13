// app/components/dashboard/CountdownCard.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Goal } from '@/types';
import { FiEdit, FiClock, FiPlayCircle, FiFlag } from 'react-icons/fi';
import { format, differenceInDays } from 'date-fns';

interface CountdownCardProps {
  goal: Goal;
  onEdit: () => void;
}

const CountdownCard: React.FC<CountdownCardProps> = ({ goal, onEdit }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // This timer updates the 'now' state every second, causing the component to re-render and the countdown to update.
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    // Cleanup the interval on component unmount to prevent memory leaks.
    return () => clearInterval(timer);
  }, []);

  // useMemo ensures that these expensive calculations only run when the goal or the 'now' state changes.
  const { timeLeft, progressPercent, totalDays, remainingDays } = useMemo(() => {
    const goalEndDate = goal.endDate.toDate();
    const goalStartDate = goal.startDate.toDate();
    const currentTime = now.getTime();

    const timeLeft = Math.max(0, goalEndDate.getTime() - currentTime);
    const totalDuration = Math.max(1, goalEndDate.getTime() - goalStartDate.getTime());
    const progressPercent = Math.min(
      100,
      ((currentTime - goalStartDate.getTime()) / totalDuration) * 100
    );

    // Using differenceInDays for more accurate day calculation, handles edge cases like DST.
    const totalDays = differenceInDays(goalEndDate, goalStartDate) + 1; // Add 1 to be inclusive
    const remainingDays = differenceInDays(goalEndDate, now) + 1;

    return { timeLeft, progressPercent, totalDays, remainingDays: Math.max(0, remainingDays) };
  }, [goal, now]);

  // Formatting the timeLeft into days, hours, minutes, and seconds for the live countdown.
  const days = String(Math.floor(timeLeft / (1000 * 60 * 60 * 24))).padStart(2, '0');
  const hours = String(Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(
    2,
    '0'
  );
  const minutes = String(Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
  const seconds = String(Math.floor((timeLeft % (1000 * 60)) / 1000)).padStart(2, '0');

  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 140; // 2 * pi * radius of the SVG circle

  return (
    <div className="p-6 sm:p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
      <div className="flex flex-col gap-8 items-center md:flex-row">
        {/* Circular Progress Bar */}
        <div className="relative flex-shrink-0 w-48 h-48 sm:w-56 sm:h-56">
          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 300 300">
            <circle
              cx="150"
              cy="150"
              r="140"
              stroke="#ffffff1a"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="150"
              cy="150"
              r="140"
              stroke="#ffffff"
              strokeWidth="12"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={CIRCLE_CIRCUMFERENCE}
              strokeDashoffset={CIRCLE_CIRCUMFERENCE * (1 - progressPercent / 100)}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="flex absolute inset-0 flex-col justify-center items-center text-center">
            <span className="text-4xl font-bold text-white sm:text-5xl">
              {Math.floor(progressPercent)}%
            </span>
            <p className="mt-1 text-sm text-white/70">Time Elapsed</p>
          </div>
        </div>

        {/* Goal Details & Countdown Timer */}
        <div className="flex flex-col w-full text-center md:text-left">
          <div className="flex gap-4 justify-center items-start md:justify-between">
            <h2 className="flex-grow text-2xl font-bold text-white sm:text-3xl">{goal.name}</h2>
            <button
              onClick={onEdit}
              className="flex-shrink-0 inline-flex cursor-pointer gap-2 items-center px-4 py-2 font-semibold text-sm text-white bg-white/[0.05] rounded-full border border-white/10 shadow-lg transition-colors duration-200 hover:bg-white/10"
            >
              <FiEdit className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          </div>
          {goal.description && <p className="mt-2 text-white/70">{goal.description}</p>}

          {/* New Date Information Section */}
          <div className="flex gap-4 justify-center mt-4 text-sm md:justify-start sm:gap-6 text-white/80">
            <div className="flex gap-2 items-center">
              <FiPlayCircle className="text-green-400" />
              <span>Start: {format(goal.startDate.toDate(), 'd MMM yyyy')}</span>
            </div>
            <div className="flex gap-2 items-center">
              <FiFlag className="text-red-400" />
              <span>End: {format(goal.endDate.toDate(), 'd MMM yyyy')}</span>
            </div>
          </div>

          <hr className="my-4 border-white/10" />

          {/* Countdown Timer */}
          <div className="mt-2">
            <p className="flex gap-2 justify-center items-center mb-2 text-sm md:justify-start text-white/60">
              <FiClock /> Time Remaining
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="p-3 text-center rounded-lg bg-white/5">
                <span className="font-mono text-3xl font-bold tracking-wider text-white sm:text-4xl">
                  {days}
                </span>
                <p className="text-xs text-white/50">Days</p>
              </div>
              <div className="p-3 text-center rounded-lg bg-white/5">
                <span className="font-mono text-3xl font-bold tracking-wider text-white sm:text-4xl">
                  {hours}
                </span>
                <p className="text-xs text-white/50">Hours</p>
              </div>
              <div className="p-3 text-center rounded-lg bg-white/5">
                <span className="font-mono text-3xl font-bold tracking-wider text-white sm:text-4xl">
                  {minutes}
                </span>
                <p className="text-xs text-white/50">Mins</p>
              </div>
              <div className="p-3 text-center rounded-lg bg-white/5">
                <span className="font-mono text-3xl font-bold tracking-wider text-white sm:text-4xl">
                  {seconds}
                </span>
                <p className="text-xs text-white/50">Secs</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-center md:text-right text-white/60">
              {remainingDays} of {totalDays} days remaining
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownCard;
