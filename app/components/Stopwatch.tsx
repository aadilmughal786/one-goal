// src/components/Stopwatch.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiClock, FiPlay, FiPause, FiRefreshCw } from 'react-icons/fi'; // Import additional icons

interface StopwatchProps {
  // showMessage is passed for toasts, making it technically not "standalone" from a UI feedback perspective,
  // but it doesn't rely on global app state for its timing logic.
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

// Internal state for the stopwatch, kept within the component.
interface InternalStopwatchState {
  running: boolean;
  time: number; // total elapsed time in ms
  lastStart: number | null; // timestamp when stopwatch was last started/resumed
}

const initialStopwatchState: InternalStopwatchState = {
  running: false,
  time: 0,
  lastStart: null,
};

const Stopwatch: React.FC<StopwatchProps> = ({ showMessage }) => {
  const [stopwatchState, setStopwatchState] =
    useState<InternalStopwatchState>(initialStopwatchState);
  const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear interval on component unmount
  useEffect(() => {
    return () => {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    };
  }, []);

  // Effect to manage the interval when the stopwatch is running
  useEffect(() => {
    if (stopwatchState.running) {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current); // Clear any existing interval

      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchState(current => ({
          ...current,
          // Calculate current time by adding elapsed time since last start to accumulated time
          time: (current.lastStart !== null ? Date.now() - current.lastStart : 0) + current.time,
        }));
      }, 100); // Update every 100ms for smoother display
    } else {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    }
    // Dependency on stopwatchState.running ensures effect re-runs when status changes
    // lastStart and time are handled within the interval update, so not direct dependencies here.
  }, [stopwatchState.running]);

  // Format the stopwatch time for display
  const formatStopwatchTime = useCallback((ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }, []);

  // Start or resume the stopwatch
  const startStopwatch = useCallback(() => {
    setStopwatchState(prev => {
      if (!prev.running) {
        showMessage('Stopwatch started!', 'info');
        return {
          ...prev,
          running: true,
          lastStart: Date.now() - prev.time, // Adjust lastStart to resume correctly
        };
      }
      return prev; // Stopwatch is already running
    });
  }, [showMessage]);

  // Pause the stopwatch
  const pauseStopwatch = useCallback(() => {
    setStopwatchState(prev => {
      if (prev.running) {
        showMessage('Stopwatch paused.', 'info');
        return {
          ...prev,
          running: false,
          time: prev.time + (prev.lastStart !== null ? Date.now() - prev.lastStart : 0), // Accumulate time
          lastStart: null,
        };
      }
      return prev; // Stopwatch is not running
    });
  }, [showMessage]);

  // Reset the stopwatch to its initial state
  const resetStopwatch = useCallback(() => {
    if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    setStopwatchState(initialStopwatchState); // Reset to initial stopwatch state
    showMessage('Stopwatch reset.', 'info');
  }, [showMessage]);

  return (
    <div
      id="stopwatchSection"
      className="p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 flex flex-col items-center"
    >
      <div className="flex gap-3 items-center mb-6">
        <FiClock className="w-8 h-8 text-blue-400" />
        <h3 className="text-2xl font-bold text-white">Stopwatch</h3>
      </div>
      <div className="mb-8 text-center">
        <span
          id="stopwatchTime"
          className="font-mono text-5xl font-extrabold text-white sm:text-6xl"
        >
          {formatStopwatchTime(stopwatchState.time)}
        </span>
      </div>
      <div className="flex flex-col gap-4 justify-center w-full max-w-sm sm:flex-row">
        <button
          onClick={stopwatchState.running ? pauseStopwatch : startStopwatch}
          className="inline-flex flex-1 gap-2 justify-center items-center px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg transition-all duration-300 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={stopwatchState.running && stopwatchState.time === 0} // Prevent pausing immediately if not running
        >
          {stopwatchState.running ? (
            <>
              <FiPause className="w-5 h-5" /> Pause
            </>
          ) : (
            <>
              <FiPlay className="w-5 h-5" /> {stopwatchState.time > 0 ? 'Resume' : 'Start'}
            </>
          )}
        </button>
        <button
          onClick={resetStopwatch}
          disabled={stopwatchState.time === 0 && !stopwatchState.running}
          className="inline-flex flex-1 gap-2 justify-center items-center px-6 py-3 font-semibold text-white bg-red-600 rounded-lg transition-all duration-300 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiRefreshCw className="w-5 h-5" /> Reset
        </button>
      </div>
    </div>
  );
};

export default Stopwatch;
