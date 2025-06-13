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

export interface AppState {
  goal: Goal | null;
  dailyProgress: DailyProgress[];
  notToDoList: ListItem[];
  contextList: ListItem[];
  toDoList: TodoItem[];
}
