// app/components/stop-watch/Stopwatch.tsx
'use client';

import { useGoalStore } from '@/store/useGoalStore';
import { useTimerStore } from '@/store/useTimerStore';
import { format } from 'date-fns';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiActivity,
  FiCheckSquare,
  FiLoader,
  FiMaximize,
  FiMinimize,
  FiPause,
  FiPlay,
  FiSave,
  FiX,
} from 'react-icons/fi';

const focusPresets = [
  { label: '3h', minutes: 180 },
  { label: '2h', minutes: 120 },
  { label: '1h', minutes: 60 },
  { label: '45m', minutes: 45 },
  { label: '30m', minutes: 30 },
  { label: '15m', minutes: 15 },
];

const breakPresets = [
  { label: '1h', minutes: 60 },
  { label: '30m', minutes: 30 },
  { label: '15m', minutes: 15 },
  { label: '5m', minutes: 5 },
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

  const formatTotalTime = (ms: number) => {
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };
  // --- End of stats logic ---

  const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    const centiseconds = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
    return { minutes, seconds, centiseconds };
  };

  const { minutes, seconds, centiseconds } = formatTime(remainingTime);
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
      <div className="mb-6">
        <h4 className="mb-3 font-semibold text-white">Focus Sessions</h4>
        <div className="grid grid-cols-3 gap-2">
          {focusPresets.map(p => (
            <button
              key={`f-${p.minutes}`}
              onClick={() => handlePresetClick(p.minutes, `${p.label} Focus`, false)}
              className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-3 font-semibold text-white">Breaks</h4>
        <div className="grid grid-cols-4 gap-2">
          {breakPresets.map(p => (
            <button
              key={`b-${p.minutes}`}
              onClick={() => handlePresetClick(p.minutes, `${p.label} Break`, true)}
              className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
            >
              {p.label}
            </button>
          ))}
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
        className="p-3 w-full font-semibold text-black bg-white rounded-lg transition-colors hover:bg-white/90 cursor-pointer"
      >
        Start Timer
      </button>
    </div>
  );

  const renderTimerState = () => (
    <>
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
      <div className="z-10 text-center">
        <div
          className="font-mono text-6xl font-bold tracking-wider text-white"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {`${minutes}:${seconds}`}
        </div>
        <p className="font-mono text-lg text-white/50">{centiseconds}</p>
        <p
          className={`mt-2 font-semibold text-sm px-3 py-1 rounded-full inline-block ${isBreak ? 'text-green-300 bg-green-500/20' : 'text-blue-300 bg-blue-500/20'}`}
        >
          {sessionLabel}
        </p>
      </div>
    </>
  );

  return (
    <div
      ref={fullScreenRef}
      className={`relative p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-lg max-w-lg mx-auto transition-all duration-300 ${isFullScreen ? 'h-screen flex flex-col justify-center items-center' : ''}`}
    >
      <h2 className="mb-8 text-2xl font-bold text-center text-white">Focus Session Timer</h2>

      <div className="flex relative justify-center items-center mx-auto mb-8 w-64 h-64">
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
            className="flex gap-2 items-center px-4 py-2 text-sm text-white/70 hover:text-white cursor-pointer"
          >
            {' '}
            <FiX /> Cancel{' '}
          </button>
        )}
        {!isPreparing && duration > 0 && (
          <>
            <button
              onClick={resetTimer}
              className="p-4 text-white rounded-full transition-colors bg-white/10 hover:bg-white/20 cursor-pointer"
              aria-label="Cancel Session"
            >
              <FiX size={24} />
            </button>
            <button
              onClick={isRunning ? pauseTimer : startTimer}
              className="flex justify-center items-center w-20 h-20 text-xl font-bold text-black bg-white rounded-full transition-transform hover:scale-105 cursor-pointer"
              aria-label={isRunning ? 'Pause' : 'Play'}
            >
              {isRunning ? <FiPause size={32} /> : <FiPlay size={32} className="ml-1" />}
            </button>
            {!isBreak ? (
              <button
                onClick={() => saveSession(false)}
                disabled={isSaving || remainingTime === duration}
                className="p-4 text-green-400 rounded-full transition-colors bg-green-600/20 hover:bg-green-500/30 disabled:opacity-50 cursor-pointer"
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

      <div className="flex justify-around pt-6 mt-8 text-center border-t border-white/10">
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
        className="absolute top-4 right-4 p-2 text-white/50 hover:text-white cursor-pointer"
        aria-label="Toggle Fullscreen"
      >
        {isFullScreen ? <FiMinimize /> : <FiMaximize />}
      </button>
    </div>
  );
};

export default Stopwatch;
