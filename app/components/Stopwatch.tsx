// src/components/Stopwatch.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiClock, FiPlay, FiPause } from 'react-icons/fi';
import { GrPowerReset } from 'react-icons/gr';

interface StopwatchProps {
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

interface InternalStopwatchState {
  running: boolean;
  startTime: number | null; // when the current session started
  elapsedTime: number; // accumulated time from previous sessions
}

const initialStopwatchState: InternalStopwatchState = {
  running: false,
  startTime: null,
  elapsedTime: 0,
};

const Stopwatch: React.FC<StopwatchProps> = ({ showMessage }) => {
  const [stopwatchState, setStopwatchState] =
    useState<InternalStopwatchState>(initialStopwatchState);
  const [displayTime, setDisplayTime] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // Update display time using requestAnimationFrame for smooth 60fps updates
  const updateDisplayTime = useCallback(() => {
    setStopwatchState(current => {
      if (current.running && current.startTime !== null) {
        const currentSessionTime = Date.now() - current.startTime;
        const totalTime = current.elapsedTime + currentSessionTime;
        setDisplayTime(totalTime);
      }
      return current;
    });

    if (stopwatchState.running) {
      animationFrameRef.current = requestAnimationFrame(updateDisplayTime);
    }
  }, [stopwatchState.running]);

  // Manage animation frame
  useEffect(() => {
    if (stopwatchState.running) {
      animationFrameRef.current = requestAnimationFrame(updateDisplayTime);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stopwatchState.running, updateDisplayTime]);

  // Format time with milliseconds for ultra-smooth display
  const formatStopwatchTime = useCallback((ms: number): string => {
    const totalMs = Math.floor(ms);
    const totalSeconds = Math.floor(totalMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((totalMs % 1000) / 10); // Show centiseconds

    const pad = (num: number) => num.toString().padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds)}`;
  }, []);

  // Start or resume the stopwatch
  const startStopwatch = useCallback(() => {
    setStopwatchState(prev => {
      if (!prev.running) {
        showMessage('Stopwatch started!', 'info');
        return {
          ...prev,
          running: true,
          startTime: Date.now(),
        };
      }
      return prev;
    });
  }, [showMessage]);

  // Pause the stopwatch
  const pauseStopwatch = useCallback(() => {
    setStopwatchState(prev => {
      if (prev.running && prev.startTime !== null) {
        const sessionTime = Date.now() - prev.startTime;
        const newElapsedTime = prev.elapsedTime + sessionTime;
        setDisplayTime(newElapsedTime);
        showMessage('Stopwatch paused.', 'info');
        return {
          ...prev,
          running: false,
          startTime: null,
          elapsedTime: newElapsedTime,
        };
      }
      return prev;
    });
  }, [showMessage]);

  // Reset the stopwatch
  const resetStopwatch = useCallback(() => {
    setStopwatchState(initialStopwatchState);
    setDisplayTime(0);
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
          className="font-mono text-5xl font-extrabold tracking-tight text-white sm:text-6xl"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formatStopwatchTime(displayTime)}
        </span>
      </div>
      <div className="flex flex-col gap-4 justify-center w-full max-w-sm sm:flex-row">
        <button
          onClick={stopwatchState.running ? pauseStopwatch : startStopwatch}
          className="inline-flex flex-1 gap-2 justify-center items-center px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg transition-all duration-200 cursor-pointer hover:bg-blue-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {stopwatchState.running ? (
            <>
              <FiPause className="w-5 h-5" />
              Pause
            </>
          ) : (
            <>
              <FiPlay className="w-5 h-5" />
              Start
            </>
          )}
        </button>
        <button
          onClick={resetStopwatch}
          disabled={displayTime === 0 && !stopwatchState.running}
          className="inline-flex flex-1 gap-2 justify-center items-center px-6 py-3 font-semibold text-white bg-red-600 rounded-lg transition-all duration-200 cursor-pointer hover:bg-red-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <GrPowerReset className="w-5 h-5" />
          Reset
        </button>
      </div>
    </div>
  );
};

export default Stopwatch;
