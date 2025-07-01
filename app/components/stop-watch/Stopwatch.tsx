// app/components/stop-watch/Stopwatch.tsx
'use client';

import { useGoalStore } from '@/store/useGoalStore';
import { useTimerStore } from '@/store/useTimerStore';
import { formatStopwatchTime, formatTotalTime } from '@/utils/dateUtils';
import { format } from 'date-fns';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiActivity,
  FiCheckSquare,
  FiCoffee,
  FiLoader,
  FiMaximize,
  FiMinimize,
  FiPause,
  FiPlay,
  FiSave,
  FiX,
  FiZap,
} from 'react-icons/fi';

const focusPresets = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: '3h', minutes: 180 },
];

const breakPresets = [
  { label: '5m', minutes: 5 },
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
];

const Stopwatch: React.FC = () => {
  const {
    isRunning,
    isPreparing,
    isBreak,
    isSaving,
    remainingTime,
    duration,
    sessionLabel,
    setTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    saveSession,
    setSessionLabel,
  } = useTimerStore();

  const [isFullScreen, setIsFullScreen] = useState(false);
  const fullScreenRef = useRef<HTMLDivElement>(null);

  // --- Fetch today's stats from the goal store ---
  const appState = useGoalStore(state => state.appState);
  const todayKey = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const todaysStats = useMemo(() => {
    const activeGoal = appState?.goals[appState.activeGoalId || ''];
    const todaysProgress = activeGoal?.dailyProgress[todayKey];
    return {
      sessions: todaysProgress?.sessions?.length || 0,
      totalTime: todaysProgress?.totalSessionDuration || 0, // in milliseconds
    };
  }, [appState, todayKey]);

  const { minutes, seconds, centiseconds } = formatStopwatchTime(remainingTime);
  const progressPercentage = duration > 0 ? ((duration - remainingTime) / duration) * 100 : 0;

  const handlePresetClick = (minutes: number, label: string, isBreakSession: boolean) => {
    setTimer(minutes, label, isBreakSession);
  };

  const toggleFullScreen = () => {
    if (!fullScreenRef.current) return;
    if (!document.fullscreenElement) {
      fullScreenRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const renderInitialState = () => (
    <div className="w-full text-center animate-fade-in">
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white">Choose a Timer</h3>
        <p className="text-white/60">Select a preset to begin a session.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Focus Section */}
        <div className="p-4 rounded-lg bg-white/5">
          <h4 className="flex gap-2 justify-center items-center mb-3 font-semibold text-white">
            <FiZap className="text-blue-400" />
            Focus
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {focusPresets.map(p => (
              <button
                key={`f-${p.minutes}`}
                onClick={() => handlePresetClick(p.minutes, `${p.label} Focus`, false)}
                className="p-3 text-lg font-semibold rounded-lg transition-colors cursor-pointer bg-black/20 hover:bg-blue-500/20 hover:text-blue-300"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {/* Break Section */}
        <div className="p-4 rounded-lg bg-white/5">
          <h4 className="flex gap-2 justify-center items-center mb-3 font-semibold text-white">
            <FiCoffee className="text-green-400" />
            Break
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {breakPresets.map(p => (
              <button
                key={`b-${p.minutes}`}
                onClick={() => handlePresetClick(p.minutes, `${p.label} Break`, true)}
                className="p-3 text-lg font-semibold rounded-lg transition-colors cursor-pointer bg-black/20 hover:bg-green-500/20 hover:text-green-300"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreparationState = () => (
    <div className="w-full max-w-xs text-center animate-fade-in">
      <p className="mb-4 text-white/80">Label your {isBreak ? 'break' : 'focus'} session:</p>
      <input
        type="text"
        value={sessionLabel}
        onChange={e => setSessionLabel(e.target.value)}
        autoFocus
        className="p-3 mb-4 w-full text-lg text-center text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={startTimer}
        className="p-3 w-full font-semibold text-black bg-white rounded-lg transition-colors cursor-pointer hover:bg-white/90"
      >
        Start Timer
      </button>
    </div>
  );

  const renderTimerState = () => (
    <div className="relative w-full h-full">
      <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="54"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          stroke="white"
          strokeWidth="4"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 54}
          strokeDashoffset={2 * Math.PI * 54 * (1 - progressPercentage / 100)}
          className="transition-all duration-1000 linear"
        />
      </svg>
      <div className="flex relative z-10 flex-col justify-center items-center w-full h-full text-center">
        <div
          className="font-mono text-6xl font-bold tracking-wider text-white"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {`${minutes}:${seconds}`}
        </div>
        <p className="font-mono text-lg text-white/50">{centiseconds}</p>
        <p
          className={`mt-2 font-semibold text-sm px-3 py-1 rounded-full inline-block ${
            isBreak ? 'text-green-300 bg-green-500/20' : 'text-blue-300 bg-blue-500/20'
          }`}
        >
          {sessionLabel}
        </p>
      </div>
    </div>
  );
  return (
    <div
      ref={fullScreenRef}
      className={`relative p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-lg max-w-5xl mx-auto transition-all duration-300 ${
        isFullScreen ? 'h-screen flex flex-col justify-center items-center' : ''
      }`}
    >
      <h2 className="mb-8 text-2xl font-bold text-center text-white">Focus Session Timer</h2>

      <div className="flex relative justify-center items-center mx-auto mb-8 w-full h-64">
        {isPreparing
          ? renderPreparationState()
          : duration > 0
            ? renderTimerState()
            : renderInitialState()}
      </div>

      <div className="flex justify-center gap-6 items-center min-h-[80px]">
        {isPreparing && (
          <button
            onClick={resetTimer}
            className="p-4 text-white bg-red-500 rounded-full transition-colors cursor-pointer hover:bg-red-600"
            aria-label="Cancel Session"
          >
            <FiX size={24} />
          </button>
        )}
        {!isPreparing && duration > 0 && (
          <>
            <button
              onClick={resetTimer}
              className="p-4 text-white rounded-full transition-colors cursor-pointer bg-white/10 hover:bg-white/20"
              aria-label="Cancel Session"
            >
              <FiX size={24} />
            </button>
            <button
              onClick={isRunning ? pauseTimer : startTimer}
              className="flex justify-center items-center w-20 h-20 text-xl font-bold text-black bg-white rounded-full transition-transform cursor-pointer hover:scale-105"
              aria-label={isRunning ? 'Pause' : 'Play'}
            >
              {isRunning ? <FiPause size={32} /> : <FiPlay size={32} className="ml-1" />}
            </button>
            {!isBreak ? (
              <button
                onClick={() => saveSession(false)}
                disabled={isSaving || remainingTime === duration}
                className="p-4 text-green-400 rounded-full transition-colors cursor-pointer bg-green-600/20 hover:bg-green-500/30 disabled:opacity-50"
                aria-label="Finish & Save Early"
              >
                {isSaving ? <FiLoader className="animate-spin" size={24} /> : <FiSave size={24} />}
              </button>
            ) : (
              <div className="w-16 h-16"></div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-around px-8 pt-6 -mx-8 mt-8 text-center border-t border-white/10">
        <div>
          <p className="flex gap-2 justify-center items-center text-2xl font-bold text-white">
            <FiCheckSquare /> {todaysStats.sessions}
          </p>
          <p className="text-sm text-white/60">Sessions Today</p>
        </div>
        <div>
          <p className="flex gap-2 justify-center items-center text-2xl font-bold text-white">
            <FiActivity /> {formatTotalTime(todaysStats.totalTime)}
          </p>
          <p className="text-sm text-white/60">Focus Time Today</p>
        </div>
      </div>

      <button
        onClick={toggleFullScreen}
        className="absolute top-4 right-4 p-2 cursor-pointer text-white/50 hover:text-white"
        aria-label="Toggle Fullscreen"
      >
        {isFullScreen ? <FiMinimize /> : <FiMaximize />}
      </button>
    </div>
  );
};

export default Stopwatch;
