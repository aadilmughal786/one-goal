// app/providers/TimerProvider.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import * as Tone from 'tone';
import { TimerContext, TimerContextType } from '@/contexts/TimerContext';
import { firebaseService } from '@/services/firebaseService';
import { StopwatchSession } from '@/types';
import type { TimerMode } from '@/components/stopwatch/PomodoroTimer';

const timeSettings: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setUser] = useState<User | null>(null);

  // Stopwatch State
  const [stopwatchIsRunning, setStopwatchIsRunning] = useState(false);
  const [stopwatchElapsedTime, setStopwatchElapsedTime] = useState(0);
  const [stopwatchIsLabeling, setStopwatchIsLabeling] = useState(false);
  const [stopwatchSessionLabel, setStopwatchSessionLabel] = useState('');
  const [isSavingStopwatch, setIsSavingStopwatch] = useState(false);

  // Pomodoro State
  const [pomodoroMode, setPomodoroMode] = useState<TimerMode>('pomodoro');
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(timeSettings.pomodoro);
  const [pomodoroIsActive, setPomodoroIsActive] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  // Refs for timers
  const stopwatchStartTimeRef = useRef<number>(0);
  const pomodoroIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopwatchFrameRef = useRef<number | null>(null);
  const synth = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    // Initialize Tone.js synth on client side
    synth.current = new Tone.Synth().toDestination();

    const unsubscribe = firebaseService.onAuthChange(user => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // --- STOPWATCH LOGIC ---
  const updateStopwatchTimer = useCallback(() => {
    if (stopwatchIsRunning) {
      setStopwatchElapsedTime(Date.now() - stopwatchStartTimeRef.current);
    }
    stopwatchFrameRef.current = requestAnimationFrame(updateStopwatchTimer);
  }, [stopwatchIsRunning]);

  useEffect(() => {
    stopwatchFrameRef.current = requestAnimationFrame(updateStopwatchTimer);
    return () => {
      if (stopwatchFrameRef.current) {
        cancelAnimationFrame(stopwatchFrameRef.current);
      }
    };
  }, [updateStopwatchTimer]);

  const handleStopwatchStart = () => {
    setStopwatchIsRunning(true);
    stopwatchStartTimeRef.current = Date.now() - stopwatchElapsedTime;
  };

  const handleStopwatchPause = () => {
    setStopwatchIsRunning(false);
  };

  const handleStopwatchReset = () => {
    if (stopwatchElapsedTime > 0 && !stopwatchIsLabeling) {
      setStopwatchIsRunning(false);
      setStopwatchIsLabeling(true);
    } else {
      setStopwatchIsRunning(false);
      setStopwatchElapsedTime(0);
      setStopwatchIsLabeling(false);
      setStopwatchSessionLabel('');
    }
  };

  const handleStopwatchSave = async () => {
    if (!currentUser || !stopwatchSessionLabel.trim()) return;
    setIsSavingStopwatch(true);
    const newSession: Omit<StopwatchSession, 'startTime'> = {
      label: stopwatchSessionLabel.trim(),
      durationMs: stopwatchElapsedTime,
    };
    try {
      await firebaseService.addStopwatchSession(currentUser.uid, newSession);
      handleStopwatchReset();
    } catch {
      // Handle error appropriately
    } finally {
      setIsSavingStopwatch(false);
    }
  };

  // --- POMODORO LOGIC ---
  const playSound = useCallback(() => {
    Tone.start();
    synth.current?.triggerAttackRelease('C5', '0.5');
  }, []);

  const handlePomodoroSwitchMode = useCallback((newMode: TimerMode) => {
    setPomodoroIsActive(false);
    setPomodoroMode(newMode);
    setPomodoroTimeLeft(timeSettings[newMode]);
  }, []);

  useEffect(() => {
    if (pomodoroIsActive && pomodoroTimeLeft > 0) {
      pomodoroIntervalRef.current = setInterval(() => {
        setPomodoroTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (pomodoroTimeLeft === 0) {
      playSound();
      if (pomodoroMode === 'pomodoro') {
        const newPomodoroCount = pomodoroCount + 1;
        setPomodoroCount(newPomodoroCount);
        handlePomodoroSwitchMode(newPomodoroCount % 4 === 0 ? 'longBreak' : 'shortBreak');
      } else {
        handlePomodoroSwitchMode('pomodoro');
      }
    }
    return () => {
      if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
    };
  }, [
    pomodoroIsActive,
    pomodoroTimeLeft,
    pomodoroMode,
    pomodoroCount,
    handlePomodoroSwitchMode,
    playSound,
  ]);

  const handlePomodoroToggle = () => {
    setPomodoroIsActive(!pomodoroIsActive);
  };

  const handlePomodoroReset = () => {
    setPomodoroIsActive(false);
    setPomodoroTimeLeft(timeSettings[pomodoroMode]);
  };

  const contextValue: TimerContextType = {
    stopwatchIsRunning,
    stopwatchElapsedTime,
    stopwatchIsLabeling,
    stopwatchSessionLabel,
    setStopwatchSessionLabel,
    handleStopwatchStart,
    handleStopwatchPause,
    handleStopwatchReset,
    handleStopwatchSave,
    isSavingStopwatch,
    pomodoroMode,
    pomodoroTimeLeft,
    pomodoroIsActive,
    pomodoroCount,
    handlePomodoroToggle,
    handlePomodoroReset,
    handlePomodoroSwitchMode,
  };

  return <TimerContext.Provider value={contextValue}>{children}</TimerContext.Provider>;
};
