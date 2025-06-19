// app/components/FloatingStopwatch.tsx
'use client';

import React, { useContext } from 'react';
import Link from 'next/link';
import { TimerContext } from '@/contexts/TimerContext';
import { GoStopwatch } from 'react-icons/go';

const FloatingStopwatch = () => {
  const context = useContext(TimerContext);

  // If the context is not available or the timer isn't running, render nothing.
  if (!context || !context.stopwatchIsRunning) {
    return null;
  }

  const { stopwatchElapsedTime } = context;

  // Helper function to format the time
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <Link
      href="/stop-watch"
      className="flex fixed right-5 bottom-5 z-50 gap-3 items-center px-4 py-3 text-white bg-blue-600 rounded-full shadow-lg transition-all duration-300 cursor-pointer hover:bg-blue-500 hover:scale-105 animate-fade-in"
      title="Go to Stopwatch"
    >
      <GoStopwatch size={22} className="animate-pulse" />
      <span
        className="font-mono text-lg font-semibold"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {formatTime(stopwatchElapsedTime)}
      </span>
    </Link>
  );
};

export default FloatingStopwatch;
