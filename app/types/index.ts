// app/types/index.ts
import { Timestamp } from 'firebase/firestore';

/**
 * Enum for satisfaction levels, used in daily reflections.
 */
export enum SatisfactionLevel {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  VERY_HIGH = 5,
}

/**
 * Enum for identifying different types of routines throughout the app.
 * Using an enum prevents typos and ensures type safety.
 */
export enum RoutineType {
  SLEEP = 'sleep',
  WATER = 'water',
  EXERCISE = 'exercise',
  MEALS = 'meals',
  TEETH = 'teeth',
  BATH = 'bath',
}

/**
 * Defines a log for daily routine completion status.
 * Maps each RoutineType to a boolean (completed) or null (not set).
 */
export type RoutineLog = Record<RoutineType, boolean | null>;

/**
 * Defines the structure for the user's primary overarching goal.
 */
export interface Goal {
  name: string;
  description: string | null;
  startDate: Timestamp; // The date the goal was set
  endDate: Timestamp; // The intended end date of the goal
}

/**
 * Represents an actionable task item in the to-do list.
 */
export interface TodoItem {
  id: string;
  text: string;
  description: string | null;
  order: number;
  completed: boolean;
  completedAt: Timestamp | null;
  deadline: Timestamp | null;
  createdAt: Timestamp; // Added back
}

/**
 * Generic structure for items in simple lists like "What Not To Do" and "Contextual Notes".
 */
export interface ListItem {
  id: string;
  text: string;
  createdAt: Timestamp; // Added back
}

/**
 * Represents a single quote.
 */
export interface Quote {
  id: number;
  text: string;
  author: string;
}

/**
 * Defines a single logged session from the stopwatch feature.
 */
export interface StopwatchSession {
  startTime: Timestamp;
  label: string;
  durationMs: number;
}

/**
 * Represents a user's logged progress for a specific day.
 */
export interface DailyProgress {
  date: string; // "YYYY-MM-DD"
  satisfactionLevel: SatisfactionLevel;
  progressNote: string;
  stopwatchSessions: StopwatchSession[];
  effortTimeMinutes: number | null;
  routineLog: RoutineLog;
}

/**
 * Base interface for routine items with a scheduled time and duration.
 */
export interface ScheduledRoutineBase {
  scheduledTime: string; // "HH:mm"
  durationMinutes: number;
  label: string;
  icon: string;
  completed: boolean | null;
}

/**
 * Settings specific to the sleep routine.
 */
export interface SleepRoutineSettings {
  bedtime: string;
  wakeTime: string;
  napSchedule: ScheduledRoutineBase[];
}

/**
 * Settings for tracking water intake.
 */
export interface WaterRoutineSettings {
  waterGoalGlasses: number;
  currentWaterGlasses: number;
}

/**
 * Container for all user-specific routine settings.
 */
export interface UserRoutineSettings {
  sleep: SleepRoutineSettings | null;
  water: WaterRoutineSettings | null;

  // Scheduled routines
  bath: ScheduledRoutineBase[];
  exercise: ScheduledRoutineBase[];
  meals: ScheduledRoutineBase[];
  teeth: ScheduledRoutineBase[];

  /** Tracks the last date on which the daily `completed` status of routines was reset. */
  lastRoutineResetDate: Timestamp | null;
}

/**
 * The root application state, stored as a single document per user.
 */
export interface AppState {
  goal: Goal | null;
  dailyProgress: Record<string, DailyProgress>;
  toDoList: TodoItem[];
  notToDoList: ListItem[];
  contextList: ListItem[];
  routineSettings: UserRoutineSettings | null;
  starredQuotes: Quote[];
}
