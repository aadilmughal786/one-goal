// app/components/Stopwatch.tsx
'use client';

import React from 'react';
import { FiPlay, FiPause, FiSave } from 'react-icons/fi';
import { GrPowerReset } from 'react-icons/gr';

interface StopwatchProps {
  isRunning: boolean;
  elapsedTime: number;
  isLabeling: boolean;
  sessionLabel: string;
  setSessionLabel: (label: string) => void;
  handleStart: () => void;
  handlePause: () => void;
  handleReset: () => void;
  handleSave: () => void;
}

const Stopwatch: React.FC<StopwatchProps> = ({
  isRunning,
  elapsedTime,
  isLabeling,
  sessionLabel,
  setSessionLabel,
  handleStart,
  handlePause,
  handleReset,
  handleSave,
}) => {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return { hours, minutes, seconds };
  };

  const { hours, minutes, seconds } = formatTime(elapsedTime);

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl max-w-3xl mx-auto">
      {isLabeling ? (
        <div className="w-full text-center">
          <p className="mb-2 text-white/70">Session Complete! What did you work on?</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={sessionLabel}
              onChange={e => setSessionLabel(e.target.value)}
              placeholder="e.g., Drafted project proposal..."
              autoFocus
              className="flex-1 p-3 text-lg text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-400/50"
              onKeyPress={e => e.key === 'Enter' && handleSave()}
            />
            <button
              onClick={handleSave}
              className="p-3 font-semibold text-white bg-green-600 rounded-lg transition-all duration-200 cursor-pointer hover:bg-green-500 hover:scale-105 active:scale-95"
            >
              <FiSave size={24} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className="flex justify-center items-center w-full font-mono text-5xl font-bold tracking-wider text-white sm:text-7xl"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            <span>{hours}</span>
            <span
              className={`px-2 transition-opacity duration-500 ${isRunning ? 'animate-pulse' : 'opacity-50'}`}
            >
              :
            </span>
            <span>{minutes}</span>
            <span
              className={`px-2 transition-opacity duration-500 ${isRunning ? 'animate-pulse' : 'opacity-50'}`}
            >
              :
            </span>
            <span>{seconds}</span>
          </div>
          <div
            className="mt-2 font-mono text-lg sm:text-xl text-white/50"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            Centiseconds: {String(Math.floor((elapsedTime % 1000) / 10)).padStart(2, '0')}
          </div>
        </>
      )}

      <div className="flex gap-4 mt-8 sm:mt-10">
        {!isLabeling && (
          <button
            onClick={isRunning ? handlePause : handleStart}
            className="flex justify-center items-center w-16 h-16 text-white rounded-full border transition-all duration-300 cursor-pointer sm:w-20 sm:h-20 bg-white/10 border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95"
          >
            {isRunning ? <FiPause size={24} /> : <FiPlay size={24} className="ml-1" />}
          </button>
        )}
        <button
          onClick={handleReset}
          disabled={elapsedTime === 0 && !isRunning && !isLabeling}
          className="flex justify-center items-center w-16 h-16 text-white rounded-full border transition-all duration-300 cursor-pointer sm:w-20 sm:h-20 bg-white/10 border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <GrPowerReset size={24} />
        </button>
      </div>
    </div>
  );
};

export default Stopwatch;
