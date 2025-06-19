// app/contexts/TimerContext.tsx
'use client';

import React from 'react';

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
}

// Create the context with a default value (it will be overridden by the provider)
export const TimerContext = React.createContext<TimerContextType | undefined>(undefined);
