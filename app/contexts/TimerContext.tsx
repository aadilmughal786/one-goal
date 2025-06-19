// app/contexts/TimerContext.tsx
'use client';

import React from 'react';
import { TimerMode } from '@/components/stopwatch/PomodoroTimer';

// Define the shape of the context's state and functions
export interface TimerContextType {
  // Stopwatch State
  stopwatchIsRunning: boolean;
  stopwatchElapsedTime: number;
  stopwatchIsLabeling: boolean;
  stopwatchSessionLabel: string;
  setStopwatchSessionLabel: (label: string) => void;
  // Stopwatch Controls
  handleStopwatchStart: () => void;
  handleStopwatchPause: () => void;
  handleStopwatchReset: () => void;
  handleStopwatchSave: () => Promise<void>;
  isSavingStopwatch: boolean;

  // Pomodoro State
  pomodoroMode: TimerMode;
  pomodoroTimeLeft: number;
  pomodoroIsActive: boolean;
  pomodoroCount: number;
  // Pomodoro Controls
  handlePomodoroToggle: () => void;
  handlePomodoroReset: () => void;
  handlePomodoroSwitchMode: (mode: TimerMode) => void;
}

// Create the context with a default value (it will be overridden by the provider)
export const TimerContext = React.createContext<TimerContextType | undefined>(undefined);
