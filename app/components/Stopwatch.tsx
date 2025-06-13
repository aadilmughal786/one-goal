// app/components/Stopwatch.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiPlay, FiPause, FiRefreshCw } from 'react-icons/fi';

interface StopwatchState {
  running: boolean;
  startTime: number;
  elapsedTime: number;
}

const initialStopwatchState: StopwatchState = {
  running: false,
  startTime: 0,
  elapsedTime: 0,
};

const Stopwatch: React.FC = () => {
  const [state, setState] = useState<StopwatchState>(initialStopwatchState);
  const animationFrameRef = useRef<number | null>(null);

  const update = useCallback(() => {
    if (state.running) {
      setState(prev => ({ ...prev, elapsedTime: Date.now() - prev.startTime }));
    }
    animationFrameRef.current = requestAnimationFrame(update);
  }, [state.running]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(update);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [update]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return { hours, minutes, seconds };
  };

  const { hours, minutes, seconds } = formatTime(state.elapsedTime);

  const start = useCallback(() => {
    setState(prev => ({
      ...prev,
      running: true,
      startTime: Date.now() - prev.elapsedTime,
    }));
  }, []);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, running: false }));
  }, []);

  const reset = useCallback(() => {
    setState(initialStopwatchState);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl max-w-xl mx-auto">
      <div
        className="flex justify-center items-center w-full font-mono text-5xl font-bold tracking-wider text-white sm:text-7xl"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        <span>{hours}</span>
        <span
          className={`px-2 transition-opacity duration-500 ${state.running ? 'animate-pulse' : 'opacity-50'}`}
        >
          :
        </span>
        <span>{minutes}</span>
        <span
          className={`px-2 transition-opacity duration-500 ${state.running ? 'animate-pulse' : 'opacity-50'}`}
        >
          :
        </span>
        <span>{seconds}</span>
      </div>
      <div
        className="mt-2 font-mono text-lg sm:text-xl text-white/50"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        Centiseconds: {String(Math.floor((state.elapsedTime % 1000) / 10)).padStart(2, '0')}
      </div>
      <div className="flex gap-4 mt-8 sm:mt-10">
        <button
          onClick={state.running ? pause : start}
          className="flex justify-center items-center w-16 h-16 text-white rounded-full border transition-all duration-300 cursor-pointer sm:w-20 sm:h-20 bg-white/10 border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95"
        >
          {state.running ? <FiPause size={28} /> : <FiPlay size={28} className="ml-1" />}
        </button>
        <button
          onClick={reset}
          disabled={state.elapsedTime === 0 && !state.running}
          className="flex justify-center items-center w-16 h-16 text-white rounded-full border transition-all duration-300 cursor-pointer sm:w-20 sm:h-20 bg-white/10 border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <FiRefreshCw size={28} />
        </button>
      </div>
    </div>
  );
};

export default Stopwatch;
