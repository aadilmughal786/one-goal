// app/types/index.ts

import { Timestamp } from 'firebase/firestore';

// =================================================================//
//
// ENUMS
//
// Defines the constant sets of values used throughout the application's
// data model. Using enums enhances readability and prevents errors
// from using invalid string values.
//
// =================================================================//

/**
 * Defines the lifecycle status of a goal, allowing the application
 * to track whether a goal is currently being pursued, has been
 * completed, is on hold, or has been abandoned.
 */
export enum GoalStatus {
  ACTIVE = 0,
  COMPLETED = 1,
  PAUSED = 2,
  CANCELLED = 3,
}

/**
 * Defines the available background colors for Sticky Notes, enabling
 * users to visually categorize or prioritize their thoughts and ideas.
 */
export enum StickyNoteColor {
  YELLOW = 0,
  BLUE = 1,
  GREEN = 2,
  PINK = 3,
  PURPLE = 4,
  ORANGE = 5,
  RED = 6,
  GRAY = 7,
}

/**
 * Defines the distinct types of daily routines a user can establish
 * and track within a goal, such as sleep, meals, or exercise.
 */
export enum RoutineType {
  SLEEP = 'sleep',
  WATER = 'water',
  TEETH = 'teeth',
  MEAL = 'meal',
  BATH = 'bath',
  EXERCISE = 'exercise',
}

/**
 * Defines the completion status for a daily routine log entry,
 * providing a more descriptive state than a simple boolean.
 */
export enum RoutineLogStatus {
  /** The default state, indicating no data has been entered for the day. */
  NOT_LOGGED = 0,
  /** The user successfully completed the routine. */
  DONE = 1,
  /** The user intentionally skipped the routine for the day. */
  SKIPPED = 2,
}

/**
 * Defines the levels of satisfaction a user can log for their daily progress.
 */
export enum SatisfactionLevel {
  VERY_UNSATISFIED = 1,
  UNSATISFIED = 2,
  NEUTRAL = 3,
  SATISFIED = 4,
  VERY_SATISFIED = 5,
}

// =================================================================//
//
// BASE INTERFACES
//
// These are the fundamental, composable building blocks for the core
// data entities. They promote code reuse and consistency.
//
// =================================================================//

/**
 * A foundational interface for all database entities, ensuring each
 * has a unique identifier and automatic timestamps for creation
 * and last modification.
 */
export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * A composable interface for any item that can be marked as complete.
 * It tracks not only the completion state but also when it was completed.
 */
export interface Completable {
  completed: boolean;
  completedAt: Timestamp | null;
}

/**
 * A composable interface for any item that can be manually sorted or
 * ordered by the user within a list.
 */
export interface Orderable {
  order: number;
}

/**
 * A composable interface for any item where a numerical count is
 * relevant, such as tracking the frequency of a distraction.
 */
export interface Countable {
  count: number;
}

// =================================================================//
//
// CORE GOAL ENTITIES
//
// These interfaces define the primary objects that a user interacts
// with directly to build and manage their goal.
//
// =================================================================//

/**
 * Represents a single, actionable task or to-do item that contributes
 * to the completion of a goal.
 */
export interface TodoItem extends BaseEntity, Completable, Orderable {
  text: string;
  description: string | null;
  deadline: Timestamp | null;
}

/**
 * Represents a habit, activity, or behavior that the user has
 * identified as a distraction from their goal.
 */
export interface DistractionItem extends BaseEntity, Countable {
  title: string;
  description: string | null;
  triggerPatterns: string[];
}

/**
 * Represents a virtual "sticky note" for capturing quick thoughts,
 * ideas, or reminders related to a goal.
 */
export interface StickyNote extends BaseEntity {
  title: string;
  content: string;
  color: StickyNoteColor;
}

// =================================================================//
//
// ROUTINES & PROGRESS TRACKING
//
// These interfaces are used to define the structure for user routines,
// daily progress logs, and other time-based tracking features.
//
// =================================================================//

/**
 * Represents a focused work session that has been timed and logged
 * by the user via the stopwatch feature. Now includes a unique ID.
 */
export interface StopwatchSession extends BaseEntity {
  startTime: Timestamp;
  label: string;
  duration: number; // Stored in milliseconds for precision
}

/**
 * A comprehensive log that tracks the user's subjective satisfaction,
 * notes, work sessions, and routine adherence for a single calendar day.
 */
export interface DailyProgress {
  /** The date of the log in `YYYY-MM-DD` format to ensure unique, queryable keys. */
  date: string;
  /** A user-provided rating indicating their satisfaction with the day's progress. */
  satisfaction: SatisfactionLevel;
  notes: string;
  sessions: StopwatchSession[];
  routines: Record<RoutineType, RoutineLogStatus>;
}

/**
 * A base interface for any user-defined, schedulable routine,
 * ensuring it has core properties like time, duration, and completion status.
 */
export interface ScheduledRoutineBase extends BaseEntity, Completable {
  /** The scheduled time for the routine in `HH:mm` format. */
  time: string;
  /** The expected duration of the routine in minutes. */
  duration: number;
  label: string;
  icon: string;
}

/**
 * Defines the user's primary sleep schedule, including main sleep/wake
 * times and any planned naps.
 */
export interface SleepRoutineSettings {
  wakeTime: string; // HH:mm
  sleepTime: string; // HH:mm
  naps: ScheduledRoutineBase[];
}

/**
 * Defines the user's daily water intake goal and tracks the current
 * progress against that goal.
 */
export interface WaterRoutineSettings {
  /** The daily hydration goal in milliliters. */
  goal: number;
  /** The current amount of water consumed today in milliliters. */
  current: number;
}

/**
 * A centralized object for configuring all user-defined routines, both
 * simple (like sleep/water) and complex scheduled events.
 */
export interface UserRoutineSettings {
  sleep: SleepRoutineSettings | null;
  water: WaterRoutineSettings | null;

  // Specific lists for different categories of scheduled routines
  bath: ScheduledRoutineBase[];
  exercise: ScheduledRoutineBase[];
  meal: ScheduledRoutineBase[];
  teeth: ScheduledRoutineBase[];

  /**
   * Tracks the last date on which the daily `completed` status of all
   * scheduled routines was reset to ensure a fresh start each day.
   */
  lastRoutineResetDate: Timestamp | null;
}

// ---

export interface Quote {
  id: number;
  text: string;
  author: string;
}

// =================================================================//
//
// TOP-LEVEL STATE
//
// These interfaces represent the highest level of the application's
// data structure, defining the overall shape of the user's data
// as it would be stored in Firestore.
//
// =================================================================//

/**
 * Represents a primary user goal, which serves as a container for all
 * associated tasks, notes, routines, and progress data. This is the
 * central and most important entity in the data model.
 */

export interface Goal extends BaseEntity {
  name: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: GoalStatus;

  /** A record of all daily progress logs, keyed by date (`YYYY-MM-DD`). */
  dailyProgress: Record<string, DailyProgress>;
  toDoList: TodoItem[];
  notToDoList: DistractionItem[];
  stickyNotes: StickyNote[];
  routineSettings: UserRoutineSettings;
  starredQuotes: number[]; // Stores an array of quote IDs
}

/**
 * The root data structure for the entire application state. It manages
 * which goal is currently active and holds the complete collection of all
 * goals for the user.
 */
export interface AppState {
  /** The `id` of the goal that is currently active in the UI. */
  activeGoalId: string | null;
  /** A map of all goals created by the user, keyed by the goal's unique `id`. */
  goals: Record<string, Goal>;
}
