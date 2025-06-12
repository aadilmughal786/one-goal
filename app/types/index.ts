// app/types/index.ts

import { Timestamp } from 'firebase/firestore';

/** Goal data structure. */
export interface Goal {
  name: string;
  description?: string;
  startDate: Timestamp; // Now exclusively Timestamp
  endDate: Timestamp; // Now exclusively Timestamp
}

/** Represents a single day's progress and work satisfaction for a goal. */
export interface DailyProgress {
  date: Timestamp; // The specific day this progress is recorded for
  satisfactionLevel: number; // e.g., 1-5, or adjust as needed for specific options
  notes?: string; // Optional notes for the day's progress
}

/** Generic list item. */
export interface ListItem {
  text: string;
  id: number; // Unique ID
}

/** To-Do list item. */
export interface TodoItem extends ListItem {
  completed: boolean;
}

/** Overall application state. */
export interface AppState {
  goal: Goal | null;
  dailyProgress: DailyProgress[]; // New field to store daily progress entries
  notToDoList: ListItem[];
  contextItems: ListItem[];
  toDoList: TodoItem[];
}

/** Developer information. */
export interface DeveloperInfo {
  name: string;
  title: string;
  email: string;
  linkedin: string;
  github: string;
  description: string;
}

// Removed: export type AppMode = 'guest' | 'google' | 'none';
