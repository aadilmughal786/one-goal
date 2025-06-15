// app/types/index.ts
import { Timestamp } from 'firebase/firestore';

// Enum for satisfaction levels (used in daily reflections)
export enum SatisfactionLevel {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  VERY_HIGH = 5,
}

// Single goal structure (no ID needed — app is scoped to one goal)
export interface Goal {
  name: string; // Goal title
  description: string; // Goal summary/plan
  endDate: Timestamp; // Intended end date

  createdAt: Timestamp; // Acts as start date (when goal was set)
  updatedAt: Timestamp; // Tracks last modification
}

// Task item toward the goal (supports drag-and-drop ordering)
export interface TodoItem {
  id: string; // Unique ID (manual or auto)
  text: string; // Task description
  description?: string | null; // Optional detailed description for the task
  order: number; // Sort order for UI
  completed: boolean; // Completion status
  completedAt?: Timestamp | null; // When task was completed (optional), can be null for Firestore
  deadline?: Timestamp | null; // Optional deadline for the task, can be null for Firestore

  createdAt: Timestamp; // When task was created
  updatedAt: Timestamp; // When last edited (not completion)
}

// Generic list item (used in Not-To-Do and Context Lists)
export interface ListItem {
  id: string; // Unique ID (manual or auto)
  text: string; // List entry text

  createdAt: Timestamp; // When added
  updatedAt: Timestamp; // When edited
}

// Stopwatch session for a specific time block (belongs to one day only)
export interface StopwatchSession {
  startTime: Timestamp; // Acts as unique ID (no overlap allowed)
  label: string; // What user focused on during session
  endTime: Timestamp; // When session ended

  createdAt: Timestamp; // When session record was created
  updatedAt: Timestamp; // Updated if session is edited
}

// One day's logged progress (keyed by date-string in AppState)
export interface DailyProgress {
  date: string; // Unique key: formatted as "YYYY-MM-DD"
  satisfactionLevel: SatisfactionLevel; // User reflection
  progressNote: string; // Daily journal/notes
  stopwatchSessions: StopwatchSession[]; // Session logs for this day

  createdAt: Timestamp; // When this day log was initialized
  updatedAt: Timestamp; // Last updated time
}

// Interfaces for Routine Management Settings

// Base interface for routines that have a scheduled time and duration
export interface ScheduledRoutineBase {
  scheduledTime: string; // e.g., "20:00" (time of day)
  durationMinutes: number; // e.g., 20
  label: string; // Label for the schedule (e.g., "Morning Nap", "Evening Bath")
  icon: string; // Icon identifier (e.g., "MdOutlineShower", "FaBed") - will be string name for react-icons
  completed?: boolean; // Optional field to track if this specific scheduled item has been completed
  updatedAt: Timestamp;
}

// Settings for the Sleep routine - now extends ScheduledRoutineBase
export interface SleepRoutineSettings extends ScheduledRoutineBase {
  // `scheduledTime` from ScheduledRoutineBase will represent the bedtime.
  // `durationMinutes` from ScheduledRoutineBase will represent the sleep goal in minutes.
  // `wakeTime` is intended to be derived from `scheduledTime` + `durationMinutes`.
  napSchedule?: ScheduledRoutineBase[] | null; // Optional array of nap entries, each is a scheduled routine
}

// Settings for Water Intake
export interface WaterRoutineSettings {
  waterGoalGlasses: number; // e.g., 8
  currentWaterGlasses: number; // Tracks consumed glasses for the current day
  updatedAt: Timestamp;
}

// Container for all user-specific routine settings
export interface UserRoutineSettings {
  sleep?: SleepRoutineSettings | null;
  bath?: ScheduledRoutineBase[] | null;
  water?: WaterRoutineSettings | null;
  exercise?: ScheduledRoutineBase[] | null;
  meals?: ScheduledRoutineBase[] | null;
  teeth?: ScheduledRoutineBase[] | null;
}

// Root state of the application (stored as one document)
export interface AppState {
  goal: Goal | null; // User-defined goal (or null before setup)

  dailyProgress: Record<string, DailyProgress>; // Fast date-based lookup for logs/UI

  toDoList: TodoItem[]; // Ordered actionable items
  notToDoList: ListItem[]; // Things to avoid doing
  contextList: ListItem[]; // Useful resources, ideas, etc.

  routineSettings?: UserRoutineSettings | null; // Optional routine settings for the user
}
