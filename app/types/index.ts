// app/types/index.ts

import { Timestamp } from 'firebase/firestore';

export interface Goal {
  name: string;
  description?: string;
  startDate: Timestamp;
  endDate: Timestamp;
}

export enum SatisfactionLevel {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  VERY_HIGH = 5,
}

export interface DailyProgress {
  date: Timestamp;
  satisfactionLevel: SatisfactionLevel;
  timeSpentMinutes: number;
  notes?: string;
}

export interface ListItem {
  text: string;
  id: number;
}

export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  startDate: Timestamp;
}

// --- NEW ---
// Defines the structure for a single saved stopwatch session.
export interface StopwatchSession {
  id: number;
  label: string;
  durationMs: number;
  date: Timestamp;
}

export interface AppState {
  goal: Goal | null;
  dailyProgress: DailyProgress[];
  notToDoList: ListItem[];
  contextList: ListItem[];
  toDoList: TodoItem[];
  // --- NEW ---
  // Adds an array to store all stopwatch sessions.
  stopwatchSessions?: StopwatchSession[];
}
