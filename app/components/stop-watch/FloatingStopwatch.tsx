// app/components/stop-watch/FloatingStopwatch.tsx
'use client';

import { useTimerStore } from '@/store/useTimerStore';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { GoStopwatch } from 'react-icons/go';

/**
 * FloatingStopwatch Component
 *
 * This component displays a floating stopwatch button at the bottom-right of the screen.
 * It is visible only when the stopwatch managed by the useTimerStore is running.
 * The elapsed time is formatted and displayed on the button.
 * Clicking the button navigates the user to the "/stop-watch" page.
 */
const FloatingStopwatch: React.FC = () => {
  // Use local state to store the timer values,
  // and update this state *after* the component has mounted (client-side).
  const [stopwatchData, setStopwatchData] = useState({
    isRunning: false,
    elapsedTime: 0,
  });

  // Effect to subscribe to the Zustand store only on the client-side.
  // This effectively delays the getServerSnapshot call until hydration is complete.
  useEffect(() => {
    // This is the Zustand listener. It will only run on the client.
    const unsubscribe = useTimerStore.subscribe(state => {
      // Update local state with the relevant store state
      setStopwatchData({
        isRunning: state.isRunning,
        elapsedTime: state.elapsedTime,
      });
    });

    // Get the initial state once subscribed
    const currentState = useTimerStore.getState();
    setStopwatchData({
      isRunning: currentState.isRunning,
      elapsedTime: currentState.elapsedTime,
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount/hydration

  // Destructure from the local state
  const { isRunning: stopwatchIsRunning, elapsedTime: stopwatchElapsedTime } = stopwatchData;

  // If the timer isn't running, render nothing to keep the UI clean.
  if (!stopwatchIsRunning) {
    return null;
  }

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
