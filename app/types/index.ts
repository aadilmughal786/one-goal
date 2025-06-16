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
 * Defines the structure for the user's primary overarching goal.
 */
export interface Goal {
  name: string;
  description: string | null;
  endDate: Timestamp; // Intended end date of the goal

  createdAt: Timestamp; // When the goal was first set
  updatedAt: Timestamp; // Last modification time of the goal
}

/**
 * Represents an actionable task item in the to-do list.
 * Properties are explicitly `null` if empty, not `undefined`.
 */
export interface TodoItem {
  id: string;
  text: string;
  description: string | null; // Detailed description of the task
  order: number; // For UI sorting and prioritization
  completed: boolean;
  completedAt: Timestamp | null; // Timestamp when the task was completed
  deadline: Timestamp | null; // Optional deadline for the task

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Generic structure for items in simple lists like "What Not To Do" and "Contextual Notes".
 */
export interface ListItem {
  id: string;
  text: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Defines a single logged session from the stopwatch feature.
 */
export interface StopwatchSession {
  startTime: Timestamp; // Serves as unique ID for the session
  label: string; // User-defined label for the focus session
  durationMs: number; // Duration of the session in milliseconds

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Represents a user's logged progress for a specific day.
 * Keys in `dailyProgress` Record are "YYYY-MM-DD" strings.
 */
export interface DailyProgress {
  date: string; // Unique key for the daily entry ("YYYY-MM-DD")
  satisfactionLevel: SatisfactionLevel; // User's reflection on daily satisfaction
  progressNote: string; // Daily journal/notes
  stopwatchSessions: StopwatchSession[]; // Log of focus sessions for this day
  effortTimeMinutes: number | null; // Sum of durationMs from stopwatchSessions, in minutes

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Base interface for routine items with a scheduled time and duration.
 * `completed` explicitly allows `null` for Firestore storage of optional booleans.
 */
export interface ScheduledRoutineBase {
  scheduledTime: string; // e.g., "20:00"
  durationMinutes: number;
  label: string;
  icon: string; // React Icon identifier string (e.g., "MdOutlineShower")
  completed: boolean | null; // True if completed for the current day, null if not set/reset
  updatedAt: Timestamp;
}

/**
 * Settings specific to the sleep routine.
 * `napSchedule` is an array and will be empty `[]` if no naps are scheduled.
 */
export interface SleepRoutineSettings extends ScheduledRoutineBase {
  napSchedule: ScheduledRoutineBase[];
}

/**
 * Settings for tracking water intake.
 */
export interface WaterRoutineSettings {
  waterGoalGlasses: number;
  currentWaterGlasses: number;
  updatedAt: Timestamp;
}

/**
 * Container for all user-specific routine settings.
 * Array properties will be empty `[]` if no schedules are set.
 * `lastDailyResetDate` explicitly allows `null`.
 */
export interface UserRoutineSettings {
  sleep: SleepRoutineSettings | null; // `null` if sleep routine not configured
  bath: ScheduledRoutineBase[];
  water: WaterRoutineSettings | null; // `null` if water routine not configured
  exercise: ScheduledRoutineBase[];
  meals: ScheduledRoutineBase[];
  teeth: ScheduledRoutineBase[];
  lastDailyResetDate: Timestamp | null; // Tracks the last date daily completion statuses were reset (can be null)
}

/**
 * The root application state, stored as a single document per user.
 * Object properties (like `goal`, `routineSettings`) are `null` if not set.
 */
export interface AppState {
  goal: Goal | null; // The user-defined primary goal

  dailyProgress: Record<string, DailyProgress>; // Date-based lookup for daily logs

  toDoList: TodoItem[]; // Ordered actionable tasks
  notToDoList: ListItem[]; // Things to avoid doing
  contextList: ListItem[]; // Useful resources, ideas, etc.

  routineSettings: UserRoutineSettings | null; // All user-specific routine configurations
}
