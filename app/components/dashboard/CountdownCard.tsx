// app/components/dashboard/CountdownCard.tsx
'use client';

import { Goal } from '@/types'; // Import Goal type
import { differenceInDays, format, eachDayOfInterval, isWeekend } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { FiChevronsRight, FiClock, FiFlag, FiPlayCircle } from 'react-icons/fi';

interface CountdownCardProps {
  goal: Goal; // Expects a Goal object
}

/**
 * CountdownCard Component
 *
 * Displays a detailed countdown and progress visualization for an active goal.
 * It shows the goal's name, description, start/end dates, a circular progress bar
 * representing time elapsed, and a live countdown to the goal's end.
 */
const CountdownCard: React.FC<CountdownCardProps> = ({ goal }) => {
  // State to hold the current time, updated every second to power the countdown.
  const [now, setNow] = useState(new Date());

  // Effect to set up and clear the interval for updating 'now' every second.
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000); // Update every 1 second
    return () => clearInterval(timer); // Cleanup interval on component unmount
  }, []);

  /**
   * Memoized calculations for countdown and progress metrics.
   * Re-calculates only when `goal` or `now` changes.
   */
  const { timeLeft, progressPercent, totalDays, remainingDays, daysPassed, weekendDays } =
    useMemo(() => {
      const goalEndDate = goal.endDate.toDate(); // Convert Firebase Timestamp to Date
      const goalStartDate = goal.startDate.toDate(); // Convert Firebase Timestamp to Date (correctly using startDate)
      const currentTime = now.getTime(); // Current time in milliseconds

      // Calculate time left in milliseconds (capped at 0)
      const timeLeftMs = Math.max(0, goalEndDate.getTime() - currentTime);
      // Calculate total duration of the goal in milliseconds (at least 1 to avoid division by zero)
      const totalDurationMs = Math.max(1, goalEndDate.getTime() - goalStartDate.getTime());
      // Calculate percentage of time elapsed, capped at 100%
      const progressPercent = Math.min(
        100,
        ((currentTime - goalStartDate.getTime()) / totalDurationMs) * 100
      );

      // Calculate total days duration, days passed, and remaining days.
      const totalDays = differenceInDays(goalEndDate, goalStartDate) + 1; // Inclusive of start and end days
      const currentDaysPassed = differenceInDays(now, goalStartDate); // Days passed from start to now
      const remainingDays = differenceInDays(goalEndDate, now) + 1; // Days remaining from now to end (inclusive)

      // Calculate weekend days
      const allDaysInGoal = eachDayOfInterval({ start: goalStartDate, end: goalEndDate });
      const weekendDays = allDaysInGoal.filter(day => isWeekend(day)).length;

      return {
        timeLeft: timeLeftMs,
        progressPercent,
        totalDays,
        remainingDays: Math.max(0, remainingDays), // Ensure remainingDays is not negative
        daysPassed: Math.max(0, currentDaysPassed), // Ensure daysPassed is not negative
        weekendDays,
      };
    }, [goal, now]); // Dependencies: re-run if goal object or 'now' changes

  // Convert timeLeft milliseconds into days, hours, minutes, and seconds for display.
  // padStart(2, '0') ensures two-digit display (e.g., "05" instead of "5").
  const days = String(Math.floor(timeLeft / (1000 * 60 * 60 * 24))).padStart(2, '0');
  const hours = String(Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(
    2,
    '0'
  );
  const minutes = String(Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
  const seconds = String(Math.floor((timeLeft % (1000 * 60)) / 1000)).padStart(2, '0');

  // Circumference for the SVG circle, used for stroke-dasharray/offset.
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 140; // Assuming radius of 140 for the SVG circle

  return (
    <div className="p-6 sm:p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
      {/* --- Top Section: Goal Title & Description --- */}
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">{goal.name}</h2>
        {/* Display description only if it's not null and not an empty string */}
        {goal.description !== null && goal.description !== '' && (
          <p className="mt-2 text-white/70">{goal.description}</p>
        )}
      </div>

      {/* --- Main Section: Progress Visualization & Countdown --- */}
      <div className="flex flex-col gap-8 items-center md:flex-row">
        {/* Left Side: Circular Progress Bar (SVG) */}
        <div className="relative flex-shrink-0 w-48 h-48 sm:w-56 sm:h-56">
          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 300 300">
            {/* Background circle for the progress track */}
            <circle
              cx="150"
              cy="150"
              r="140"
              stroke="#ffffff1a" // Light grey for the track
              strokeWidth="12"
              fill="transparent"
            />
            {/* Foreground circle for the progress indicator */}
            <circle
              cx="150"
              cy="150"
              r="140"
              stroke="#ffffff" // White for the progress
              strokeWidth="12"
              fill="transparent"
              strokeLinecap="round" // Rounded ends for the stroke
              // Dynamically set strokeDashoffset based on progressPercent
              strokeDasharray={CIRCLE_CIRCUMFERENCE}
              strokeDashoffset={CIRCLE_CIRCUMFERENCE * (1 - progressPercent / 100)}
              className="transition-all duration-1000 ease-linear" // Smooth animation for progress
            />
          </svg>
          {/* Text displayed inside the circular progress bar */}
          <div className="flex absolute inset-0 flex-col justify-center items-center text-center">
            <span className="text-4xl font-bold text-white sm:text-5xl">
              {Math.floor(progressPercent)}%
            </span>
            <p className="mt-1 text-sm text-white/70">Time Elapsed</p>
          </div>
        </div>

        {/* Right Side: Goal Dates, Day Counters, and Live Countdown Timer */}
        <div className="flex flex-col w-full text-center md:text-left">
          {/* Goal Start and End Dates */}
          <div className="flex gap-4 justify-center my-4 text-sm md:justify-start sm:gap-6 text-white/80">
            <div className="flex gap-2 items-center">
              <FiPlayCircle className="text-green-400" />
              <span>Start: {format(goal.startDate.toDate(), 'd MMM yy')}</span>
            </div>
            <div className="flex gap-2 items-center">
              <FiFlag className="text-red-400" />
              <span>End: {format(goal.endDate.toDate(), 'd MMM yy')}</span>
            </div>
          </div>

          {/* Days Passed and Days Left counters */}
          <div className="flex gap-4 justify-center mb-4 text-sm md:justify-start sm:gap-6 text-white/80">
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

          {/* Live Countdown Timer */}
          <div className="mt-2">
            <p className="flex gap-2 justify-center items-center mb-2 text-sm md:justify-start text-white/60">
              <FiClock /> Time Remaining
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {/* Days */}
              <div className="p-3 text-center rounded-lg bg-white/5">
                <span className="font-mono text-3xl font-bold tracking-wider text-white sm:text-4xl">
                  {days}
                </span>
                <p className="text-xs text-white/50">Days</p>
              </div>
              {/* Hours */}
              <div className="p-3 text-center rounded-lg bg-white/5">
                <span className="font-mono text-3xl font-bold tracking-wider text-white sm:text-4xl">
                  {hours}
                </span>
                <p className="text-xs text-white/50">Hours</p>
              </div>
              {/* Minutes */}
              <div className="p-3 text-center rounded-lg bg-white/5">
                <span className="font-mono text-3xl font-bold tracking-wider text-white sm:text-4xl">
                  {minutes}
                </span>
                <p className="text-xs text-white/50">Mins</p>
              </div>
              {/* Seconds */}
              <div className="p-3 text-center rounded-lg bg-white/5">
                <span className="font-mono text-3xl font-bold tracking-wider text-white sm:text-4xl">
                  {seconds}
                </span>
                <p className="text-xs text-white/50">Secs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownCard;
