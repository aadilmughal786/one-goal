// app/providers/TimerProvider.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp
import { TimerContext, TimerContextType } from '@/contexts/TimerContext';
import { firebaseService } from '@/services/firebaseService';
import { StopwatchSession } from '@/types';

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setUser] = useState<User | null>(null);
  // NEW: State to hold the active goal ID
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);

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
    const unsubscribe = firebaseService.onAuthChange(async user => {
      setUser(user);
      if (user) {
        try {
          // Fetch user data to get the activeGoalId
          const appState = await firebaseService.getUserData(user.uid);
          setActiveGoalId(appState.activeGoalId);
        } catch (error) {
          console.error("Error fetching user's active goal:", error);
          setActiveGoalId(null); // Ensure it's cleared on error
        }
      } else {
        setActiveGoalId(null); // Clear active goal if user logs out
      }
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

  // --- RELOAD WARNING LOGIC ---
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (stopwatchIsRunning) {
        // Calling preventDefault is the modern way to trigger the confirmation prompt.
        // The custom message in `returnValue` is ignored by most browsers.
        event.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [stopwatchIsRunning]);

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
    // Check if a user is logged in, there's an active goal, and a label is provided
    if (!currentUser) {
      console.error('Cannot save stopwatch session: User not authenticated.');
      return;
    }
    if (!activeGoalId) {
      console.error(
        'Cannot save stopwatch session: No active goal selected. Please select a goal.'
      );
      return;
    }
    if (!stopwatchSessionLabel.trim()) {
      console.error('Cannot save stopwatch session: Label is required.');
      return;
    }

    setIsSavingStopwatch(true);
    const newSession: Omit<StopwatchSession, 'id' | 'createdAt' | 'updatedAt'> = {
      label: stopwatchSessionLabel.trim(),
      duration: stopwatchElapsedTime, // Use 'duration' as per new type
      // FIX: Add the required 'startTime' property as a Firebase Timestamp
      startTime: Timestamp.fromDate(new Date(stopwatchStartTimeRef.current)),
    };

    try {
      // Pass the activeGoalId to the service method
      await firebaseService.addStopwatchSession(activeGoalId, currentUser.uid, newSession);
      handleStopwatchReset(); // Reset stopwatch after successful save
    } catch (error) {
      console.error('Failed to save stopwatch session:', error);
      // Implement user-facing error notification here (e.g., a toast message)
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
