// app/components/stop-watch/FloatingStopwatch.tsx
'use client';

import React, { useContext } from 'react';
import Link from 'next/link';
import { TimerContext } from '@/contexts/TimerContext';
import { GoStopwatch } from 'react-icons/go';

/**
 * FloatingStopwatch Component
 *
 * This component displays a floating stopwatch button at the bottom-right of the screen.
 * It is visible only when the stopwatch managed by the TimerContext is running.
 * The elapsed time is formatted and displayed on the button.
 * Clicking the button navigates the user to the "/stop-watch" page.
 */
const FloatingStopwatch = () => {
  // Access the TimerContext to get stopwatch state and controls.
  const context = useContext(TimerContext);

  // If the context is not available (e.g., provider not mounted)
  // or the timer isn't running, render nothing to keep the UI clean.
  if (!context || !context.stopwatchIsRunning) {
    return null;
  }

  // Destructure stopwatchElapsedTime from the context for display.
  const { stopwatchElapsedTime } = context;

  /**
   * Helper function to format milliseconds into HH:MM:SS string.
   * @param ms The elapsed time in milliseconds.
   * @returns A formatted time string (e.g., "00:01:23").
   */
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000); // Convert milliseconds to total seconds
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0'); // Calculate hours and pad with leading zero if needed
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0'); // Calculate minutes and pad
    const seconds = String(totalSeconds % 60).padStart(2, '0'); // Calculate seconds and pad
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    // Link component from Next.js for client-side navigation.
    // The className uses Tailwind CSS for styling, including fixed positioning,
    // spacing, colors, rounded corners, shadows, and hover effects.
    // animate-fade-in is a custom animation class (assumed to be defined in global CSS).
    <Link
      href="/stop-watch"
      className="flex fixed right-5 bottom-5 z-50 gap-3 items-center px-4 py-3 text-white bg-blue-600 rounded-full shadow-lg transition-all duration-300 cursor-pointer hover:bg-blue-500 hover:scale-105 animate-fade-in"
      title="Go to Stopwatch" // Accessible title for the button
    >
      {/* Stopwatch icon from react-icons, with a pulse animation */}
      <GoStopwatch size={22} className="animate-pulse" />
      {/* Display the formatted elapsed time.
          font-mono and fontVariantNumeric: 'tabular-nums' ensure fixed-width digits
          for a stable display as time updates. */}
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
