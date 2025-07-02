// app/types/index.ts

import { Timestamp } from 'firebase/firestore';

// =================================================================//
//                            ENUMS
// =================================================================//

export enum GoalStatus {
  ACTIVE = 0,
  COMPLETED = 1,
  PAUSED = 2,
  CANCELLED = 3,
}

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

export enum RoutineType {
  SLEEP = 'sleep',
  WATER = 'water',
  TEETH = 'teeth',
  MEAL = 'meal',
  BATH = 'bath',
  EXERCISE = 'exercise',
}

export enum RoutineLogStatus {
  NOT_LOGGED = 0,
  DONE = 1,
  SKIPPED = 2,
}

export enum SatisfactionLevel {
  VERY_UNSATISFIED = 1,
  UNSATISFIED = 2,
  NEUTRAL = 3,
  SATISFIED = 4,
  VERY_SATISFIED = 5,
}

export enum ReminderType {
  WATER = 'water',
  EYE_CARE = 'eyeCare',
  STRETCH = 'stretch',
  BREAK = 'break',
  POSTURE = 'posture',
}

// NEW: Enum for different resource types
export enum ResourceType {
  IMAGE = 'image',
  VIDEO = 'video',
  ARTICLE = 'article',
  OTHER = 'other',
}

// =================================================================//
//                      COMPOSABLE INTERFACES
// =================================================================//

export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Completable {
  completed: boolean;
  completedAt: Timestamp | null;
}

export interface Orderable {
  order: number;
}

export interface Countable {
  count: number;
}

// =================================================================//
//                      CORE DOMAIN ENTITIES
// =================================================================//

export interface TodoItem extends BaseEntity, Completable, Orderable {
  text: string;
  description: string | null;
  deadline: Timestamp | null;
}

export interface DistractionItem extends BaseEntity, Countable {
  title: string;
  description: string | null;
  triggerPatterns: string[];
}

export interface StickyNote extends BaseEntity {
  title: string;
  content: string;
  color: StickyNoteColor;
}

export interface TimeBlock extends BaseEntity, Completable {
  label: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  color: string;
}

// NEW: Interface for a single resource link
export interface Resource extends BaseEntity {
  url: string;
  title: string;
  description: string | null;
  type: ResourceType;
}

// =================================================================//
//                   ROUTINES & PROGRESS TRACKING
// =================================================================//

export interface StopwatchSession extends BaseEntity {
  startTime: Timestamp;
  label: string;
  duration: number; // in milliseconds
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD format
  satisfaction: SatisfactionLevel;
  notes: string;
  sessions: StopwatchSession[];
  routines: Record<RoutineType, RoutineLogStatus>;
  totalSessionDuration: number;
  weight: number | null;
}

export interface ScheduledRoutineBase extends BaseEntity, Completable {
  time: string; // HH:mm format
  duration: number; // in minutes
  label: string;
  icon: string;
}

export interface SleepRoutineSettings {
  wakeTime: string; // HH:mm format
  sleepTime: string; // HH:mm format
  naps: ScheduledRoutineBase[];
}

export interface WaterRoutineSettings {
  goal: number; // in glasses
  current: number;
}

export interface UserRoutineSettings {
  sleep: SleepRoutineSettings | null;
  water: WaterRoutineSettings | null;
  bath: ScheduledRoutineBase[];
  exercise: ScheduledRoutineBase[];
  meal: ScheduledRoutineBase[];
  teeth: ScheduledRoutineBase[];
  lastRoutineResetDate: Timestamp | null;
}

export interface ReminderSetting {
  enabled: boolean;
  frequency: number; // in minutes
}

export interface WellnessSettings {
  [ReminderType.WATER]: ReminderSetting;
  [ReminderType.EYE_CARE]: ReminderSetting;
  [ReminderType.STRETCH]: ReminderSetting;
  [ReminderType.BREAK]: ReminderSetting;
  [ReminderType.POSTURE]: ReminderSetting;
}

export interface Quote {
  id: number;
  text: string;
  author: string;
}

// =================================================================//
//                        TOP-LEVEL STATE
// =================================================================//

export interface Goal extends BaseEntity {
  name: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: GoalStatus;
  dailyProgress: Record<string, DailyProgress>;
  toDoList: TodoItem[];
  notToDoList: DistractionItem[];
  stickyNotes: StickyNote[];
  routineSettings: UserRoutineSettings;
  wellnessSettings: WellnessSettings;
  starredQuotes: number[];
  timeBlocks: TimeBlock[];
  randomPickerItems: string[];
  resources: Resource[]; // NEW: Add resources array to Goal
}

export interface AppState {
  activeGoalId: string | null;
  goals: Record<string, Goal>;
}
