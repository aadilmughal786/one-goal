// app/components/stopwatch/PomodoroTimer.tsx
'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';
import { FiPlay, FiPause, FiMaximize, FiMinimize } from 'react-icons/fi';
import { GrPowerReset } from 'react-icons/gr';
import { TimerContext } from '@/contexts/TimerContext';

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

const timeSettings: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const PomodoroTimer: React.FC = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('PomodoroTimer must be used within a TimerProvider');
  }

  const {
    pomodoroMode,
    pomodoroTimeLeft,
    pomodoroIsActive,
    pomodoroCount,
    handlePomodoroToggle,
    handlePomodoroReset,
    handlePomodoroSwitchMode,
  } = context;

  const [isFullScreen, setIsFullScreen] = useState(false);
  const fullScreenRef = useRef<HTMLDivElement>(null);

  const toggleFullScreen = () => {
    if (!fullScreenRef.current) return;
    if (!document.fullscreenElement) {
      fullScreenRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const progress = (pomodoroTimeLeft / timeSettings[pomodoroMode]) * 100;

  const modeDetails: Record<TimerMode, { label: string; color: string }> = {
    pomodoro: { label: 'Focus', color: 'text-red-400' },
    shortBreak: { label: 'Short Break', color: 'text-blue-400' },
    longBreak: { label: 'Long Break', color: 'text-green-400' },
  };

  return (
    <div
      ref={fullScreenRef}
      className="flex flex-col justify-center items-center p-4 w-full text-white bg-black transition-colors duration-500"
    >
      <div
        className={`w-full max-w-lg mx-auto p-6 rounded-3xl border shadow-2xl transition-all duration-300 ${isFullScreen ? 'bg-black border-black' : 'bg-white/[0.02] border-white/10'}`}
      >
        <div className="flex gap-2 justify-center mb-8">
          {Object.keys(timeSettings).map(m => (
            <button
              key={m}
              onClick={() => handlePomodoroSwitchMode(m as TimerMode)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${pomodoroMode === m ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            >
              {m === 'pomodoro' ? 'Pomodoro' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </button>
          ))}
        </div>

        <div className="flex relative justify-center items-center mx-auto mb-8 w-64 h-64">
          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="#ffffff1a"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 90}
              strokeDashoffset={2 * Math.PI * 90 * (1 - progress / 100)}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-linear ${modeDetails[pomodoroMode].color}`}
            />
          </svg>
          <div className="z-10 text-center">
            <div
              className={`font-mono text-6xl font-bold tracking-widest text-white transition-colors duration-500`}
            >
              {formatTime(pomodoroTimeLeft)}
            </div>
            <div
              className={`mt-2 text-lg font-semibold uppercase tracking-widest transition-colors duration-500 ${modeDetails[pomodoroMode].color}`}
            >
              {modeDetails[pomodoroMode].label}
            </div>
          </div>
        </div>

        <div className="flex gap-6 justify-center items-center">
          <button
            onClick={handlePomodoroReset}
            className="p-4 rounded-full transition-colors cursor-pointer text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Reset Timer"
          >
            <GrPowerReset size={24} />
          </button>
          <button
            onClick={handlePomodoroToggle}
            className="flex justify-center items-center w-20 h-20 text-white bg-blue-600 rounded-full shadow-lg transition-all duration-300 cursor-pointer hover:bg-blue-500 hover:scale-105 active:scale-95"
            aria-label={pomodoroIsActive ? 'Pause Timer' : 'Start Timer'}
          >
            {pomodoroIsActive ? <FiPause size={32} /> : <FiPlay size={32} className="ml-1" />}
          </button>
          <button
            onClick={toggleFullScreen}
            className="p-4 rounded-full transition-colors cursor-pointer text-white/70 hover:bg-white/10 hover:text-white"
            aria-label={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullScreen ? <FiMinimize size={24} /> : <FiMaximize size={24} />}
          </button>
        </div>

        <p className="mt-8 text-sm text-center text-white/50">
          Focus Sessions Completed: {pomodoroCount}
        </p>
      </div>
    </div>
  );
};

export default PomodoroTimer;
