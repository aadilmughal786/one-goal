// app/providers/TimerProvider.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { TimerContext, TimerContextType } from '@/contexts/TimerContext';
import { firebaseService } from '@/services/firebaseService';
import { StopwatchSession } from '@/types';

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setUser] = useState<User | null>(null);

  // Stopwatch State
  const [stopwatchIsRunning, setStopwatchIsRunning] = useState(false);
  const [stopwatchElapsedTime, setStopwatchElapsedTime] = useState(0);
  const [stopwatchIsLabeling, setStopwatchIsLabeling] = useState(false);
  const [stopwatchSessionLabel, setStopwatchSessionLabel] = useState('');
  const [isSavingStopwatch, setIsSavingStopwatch] = useState(false);

  // Refs for timers
  const stopwatchStartTimeRef = useRef<number>(0);
  const stopwatchFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize Tone.js synth on client side

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
  };

  return <TimerContext.Provider value={contextValue}>{children}</TimerContext.Provider>;
};
