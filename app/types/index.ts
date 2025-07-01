// app/types/index.ts

import { Timestamp } from 'firebase/firestore';

// =================================================================//
//                            ENUMS
// =================================================================//

/** Represents the lifecycle status of a user's goal. */
export enum GoalStatus {
  ACTIVE = 0,
  COMPLETED = 1,
  PAUSED = 2,
  CANCELLED = 3,
}

/** Defines the available background colors for Sticky Notes. */
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

/** Represents the distinct types of daily routines a user can track. */
export enum RoutineType {
  SLEEP = 'sleep',
  WATER = 'water',
  TEETH = 'teeth',
  MEAL = 'meal',
  BATH = 'bath',
  EXERCISE = 'exercise',
}

/** Defines the completion status for a daily routine log entry. */
export enum RoutineLogStatus {
  NOT_LOGGED = 0,
  DONE = 1,
  SKIPPED = 2,
}

/** Represents the user's subjective satisfaction level for a given day. */
export enum SatisfactionLevel {
  VERY_UNSATISFIED = 1,
  UNSATISFIED = 2,
  NEUTRAL = 3,
  SATISFIED = 4,
  VERY_SATISFIED = 5,
}

/** Defines the types of wellness reminders available. */
export enum ReminderType {
  WATER = 'water',
  EYE_CARE = 'eyeCare',
  STRETCH = 'stretch',
  BREAK = 'break',
}

// =================================================================//
//                      COMPOSABLE INTERFACES
// =================================================================//

/** A foundational interface for all database entities. */
export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** An interface for any item that can be marked as complete. */
export interface Completable {
  completed: boolean;
  completedAt: Timestamp | null;
}

/** An interface for any item that can be manually ordered. */
export interface Orderable {
  order: number;
}

/** An interface for any item that tracks a numerical count. */
export interface Countable {
  count: number;
}

// =================================================================//
//                      CORE DOMAIN ENTITIES
// =================================================================//

/** A single, actionable task that contributes to a goal. */
export interface TodoItem extends BaseEntity, Completable, Orderable {
  text: string;
  description: string | null;
  deadline: Timestamp | null;
}

/** A habit or behavior the user wants to avoid. */
export interface DistractionItem extends BaseEntity, Countable {
  title: string;
  description: string | null;
  triggerPatterns: string[];
}

/** A virtual "sticky note" for capturing quick thoughts. */
export interface StickyNote extends BaseEntity {
  title: string;
  content: string;
  color: StickyNoteColor;
}

/** A block of time scheduled for a specific activity. */
export interface TimeBlock extends BaseEntity, Completable {
  label: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  color: string; // To visually distinguish different blocks
}

// =================================================================//
//                   ROUTINES & PROGRESS TRACKING
// =================================================================//

/** A focused work session logged by the user via the stopwatch. */
export interface StopwatchSession extends BaseEntity {
  startTime: Timestamp;
  label: string;
  /** Duration of the session, stored in milliseconds. */
  duration: number;
}

/** A log that tracks user progress for a single calendar day. */
export interface DailyProgress {
  /** The date of the log in `YYYY-MM-DD` format. */
  date: string;
  satisfaction: SatisfactionLevel;
  notes: string;
  sessions: StopwatchSession[];
  routines: Record<RoutineType, RoutineLogStatus>;
  /** A denormalized sum of all session durations for this day (in ms) for performance. */
  totalSessionDuration: number;
  /** The user's weight for the day, in a user-defined unit (e.g., kg, lbs). Can be null if not logged. */
  weight: number | null;
}

/** A base interface for any user-defined, schedulable routine. */
export interface ScheduledRoutineBase extends BaseEntity, Completable {
  /** The scheduled time in `HH:mm` (24-hour) format. */
  time: string;
  /** The expected duration in minutes. */
  duration: number;
  label: string;
  icon: string;
}

/** The user's primary sleep schedule and planned naps. */
export interface SleepRoutineSettings {
  wakeTime: string; // HH:mm (24-hour)
  sleepTime: string; // HH:mm (24-hour)
  naps: ScheduledRoutineBase[];
}

/** The user's daily water intake goal and progress. */
export interface WaterRoutineSettings {
  /** The daily hydration goal in number of glasses. */
  goal: number;
  /** The current number of glasses consumed today. */
  current: number;
}

/** A centralized object for all user-defined routines. */
export interface UserRoutineSettings {
  sleep: SleepRoutineSettings | null;
  water: WaterRoutineSettings | null;
  bath: ScheduledRoutineBase[];
  exercise: ScheduledRoutineBase[];
  meal: ScheduledRoutineBase[];
  teeth: ScheduledRoutineBase[];
  /** Tracks the last date on which daily routines were reset. */
  lastRoutineResetDate: Timestamp | null;
}

/** Configuration for a single wellness reminder. */
export interface ReminderSetting {
  enabled: boolean;
  /** The frequency of the reminder in minutes. */
  frequency: number;
}

/** A centralized object for all wellness reminder configurations. */
export interface WellnessSettings {
  [ReminderType.WATER]: ReminderSetting;
  [ReminderType.EYE_CARE]: ReminderSetting;
  [ReminderType.STRETCH]: ReminderSetting;
  [ReminderType.BREAK]: ReminderSetting;
}

/** Represents a single motivational quote. */
export interface Quote {
  id: number;
  text: string;
  author: string;
}

// =================================================================//
//                        TOP-LEVEL STATE
// =================================================================//

/**
 * Represents a primary user goal, serving as a container for all related data.
 * This is the central entity in the data model.
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
  wellnessSettings: WellnessSettings; // <-- ADDED
  /** An array of IDs for the user's favorite quotes for this goal. */
  starredQuotes: number[];
  timeBlocks: TimeBlock[];
}

/**
 * The root data structure for the entire application state, as stored in Firestore.
 */
export interface AppState {
  /** The `id` of the goal that is currently active in the UI. */
  activeGoalId: string | null;
  /** A map of all goals created by the user, keyed by the goal's unique `id`. */
  goals: Record<string, Goal>;
}
