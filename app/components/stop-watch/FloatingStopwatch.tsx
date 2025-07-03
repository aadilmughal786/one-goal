// app/components/stop-watch/FloatingStopwatch.tsx
'use client';

import { useTimerStore } from '@/store/useTimerStore';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { FiCoffee, FiZap } from 'react-icons/fi';

const FloatingStopwatch: React.FC = () => {
  const [timerData, setTimerData] = useState({
    isRunning: false,
    remainingTime: 0,
    duration: 0,
    sessionLabel: '',
    isBreak: false,
  });

  useEffect(() => {
    const unsubscribe = useTimerStore.subscribe(state => {
      setTimerData({
        isRunning: state.isRunning,
        remainingTime: state.remainingTime,
        duration: state.duration,
        sessionLabel: state.sessionLabel,
        isBreak: state.isBreak,
      });
    });

    const currentState = useTimerStore.getState();
    setTimerData({
      isRunning: currentState.isRunning,
      remainingTime: currentState.remainingTime,
      duration: currentState.duration,
      sessionLabel: currentState.sessionLabel,
      isBreak: currentState.isBreak,
    });

    return () => unsubscribe();
  }, []);

  const { isRunning, remainingTime, duration, sessionLabel, isBreak } = timerData;

  if (!isRunning || duration === 0) {
    return null;
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');

    if (parseInt(hours) > 0) {
      return `${hours}:${minutes}:${seconds}`;
    }
    return `${minutes}:${seconds}`;
  };

  const progressPercentage = duration > 0 ? ((duration - remainingTime) / duration) * 100 : 0;

  const bgColor = isBreak ? 'bg-green-600' : 'bg-blue-600';
  const hoverBgColor = isBreak ? 'hover:bg-green-500' : 'hover:bg-blue-500';
  const progressFillColor = isBreak ? 'bg-green-500' : 'bg-blue-500';
  const Icon = isBreak ? FiCoffee : FiZap;

  return (
    <Link
      href="/stop-watch?tab=stopwatch"
      className={`flex overflow-hidden fixed right-5 bottom-5 z-50 items-center px-4 h-12 rounded shadow-lg transition-all duration-300 cursor-pointer animate-fade-in ${bgColor} ${hoverBgColor} hover:scale-105`}
      title={sessionLabel}
    >
      <div
        className={`absolute top-0 left-0 h-full transition-all duration-500 ease-linear ${progressFillColor}`}
        style={{ width: `${progressPercentage}%` }}
      />
      <div className="flex relative z-10 gap-3 items-center w-full text-white">
        <Icon size={20} className="flex-shrink-0" />
        <div className="flex gap-2 items-baseline leading-none">
          <span className="text-sm font-semibold truncate"> {isBreak ? 'Break' : 'Focus'}</span>
          <span
            className="font-mono text-base font-semibold"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatTime(remainingTime)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default FloatingStopwatch;
