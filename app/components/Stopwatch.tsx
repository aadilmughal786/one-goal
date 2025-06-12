// src/components/Stopwatch.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiClock } from 'react-icons/fi'; // Import the clock icon
import { StopwatchState } from '@/types'; // Import StopwatchState type

interface StopwatchProps {
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

const initialStopwatchState: StopwatchState = {
  running: false,
  time: 0,
  lastStart: null,
};

const Stopwatch: React.FC<StopwatchProps> = ({ showMessage }) => {
  const [stopwatchState, setStopwatchState] = useState<StopwatchState>(initialStopwatchState);
  const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear interval on component unmount
  useEffect(() => {
    return () => {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    };
  }, []);

  // Format the stopwatch time for display
  const formatStopwatchTime = useCallback((ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Start or resume the stopwatch
  const startStopwatch = useCallback(() => {
    setStopwatchState(prev => {
      if (!prev.running) {
        const newStopwatch: StopwatchState = {
          ...prev, // Use existing time if resuming
          running: true,
          lastStart: Date.now() - prev.time, // Calculate the true start time
        };
        // Clear any existing interval to prevent multiple timers
        if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);

        // Set up a new interval to update time
        stopwatchIntervalRef.current = setInterval(() => {
          setStopwatchState(current => ({
            ...current,
            time: Date.now() - (current.lastStart || 0),
          }));
        }, 100); // Update every 100ms for smoother display
        showMessage('Stopwatch started!', 'info');
        return newStopwatch;
      }
      return prev; // Stopwatch is already running
    });
  }, [showMessage]);

  // Pause the stopwatch
  const pauseStopwatch = useCallback(() => {
    setStopwatchState(prev => {
      if (prev.running) {
        if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
        showMessage('Stopwatch paused.', 'info');
        return {
          ...prev,
          running: false,
          time: Date.now() - (prev.lastStart || 0), // Capture current time precisely
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
    <div id="stopwatchSection" className="p-6 mt-6 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex gap-2 items-center mb-4">
        <FiClock className="w-6 h-6 text-blue-500" />
        <h3 className="text-xl font-bold text-gray-800">Stopwatch</h3>
      </div>
      <div className="mb-4 text-center">
        <span id="stopwatchTime" className="font-mono text-3xl font-bold text-gray-800">
          {formatStopwatchTime(stopwatchState.time)}
        </span>
      </div>
      <div className="flex gap-4 justify-center">
        <button
          onClick={stopwatchState.running ? pauseStopwatch : startStopwatch}
          className="px-4 py-2 text-white bg-blue-500 rounded-lg transition-all duration-300 hover:bg-blue-600"
        >
          {stopwatchState.running ? 'Stop' : stopwatchState.time > 0 ? 'Resume' : 'Start'}
        </button>
        <button
          onClick={pauseStopwatch}
          disabled={!stopwatchState.running && stopwatchState.time === 0}
          className="px-4 py-2 text-white bg-gray-500 rounded-lg transition-all duration-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Pause
        </button>
        <button
          onClick={resetStopwatch}
          disabled={stopwatchState.time === 0}
          className="px-4 py-2 text-white bg-red-500 rounded-lg transition-all duration-300 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Stopwatch;
