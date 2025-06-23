// app/utils/schemas.ts
import {
  GoalStatus,
  RoutineLogStatus,
  RoutineType,
  SatisfactionLevel,
  StickyNoteColor,
} from '@/types';
import { Timestamp } from 'firebase/firestore';
import { z } from 'zod'; // <--- ADDED: Import 'z' from 'zod'

/**
 * @file app/utils/schemas.ts
 * @description Zod Schemas for Runtime Data Validation.
 *
 * This file is the single source of truth for the shape of our application's data.
 * By defining our data structures with Zod, we can validate data at runtime,
 * protecting the application from crashes caused by unexpected or malformed data
 * from external sources like Firestore or user-uploaded files.
 */

// Custom schema to validate that a value is an instance of Firebase's Timestamp.
const timestampSchema = z.instanceof(Timestamp, { message: 'Invalid Firestore Timestamp' });

// --- BASE SCHEMAS ---
const baseEntitySchema = z.object({
  id: z.string().min(1, 'ID cannot be empty'),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

const completableSchema = z.object({
  completed: z.boolean(),
  completedAt: timestampSchema.nullable(),
});

// --- CORE GOAL ENTITY SCHEMAS ---
export const todoItemSchema = baseEntitySchema.merge(completableSchema).extend({
  text: z.string().min(1, 'To-do text cannot be empty'),
  description: z.string().nullable(),
  deadline: timestampSchema.nullable(),
  order: z.number(),
});

export const distractionItemSchema = baseEntitySchema.extend({
  title: z.string().min(1, 'Distraction title cannot be empty'),
  description: z.string().nullable(),
  triggerPatterns: z.array(z.string()),
  count: z.number().min(0),
});

export const stickyNoteSchema = baseEntitySchema.extend({
  title: z.string().min(1, 'Sticky note title cannot be empty'),
  content: z.string(),
  color: z.nativeEnum(StickyNoteColor),
});

// --- ROUTINE & PROGRESS SCHEMAS ---
export const stopwatchSessionSchema = baseEntitySchema.extend({
  startTime: timestampSchema,
  label: z.string().min(1, 'Session label cannot be empty'),
  duration: z.number().min(0, 'Duration cannot be negative'),
});

const routinesSchema = z
  .record(z.nativeEnum(RoutineType), z.nativeEnum(RoutineLogStatus))
  .optional()
  .default({})
  .transform(routines => {
    const completeRoutines: Record<RoutineType, RoutineLogStatus> = {
      [RoutineType.SLEEP]: routines?.[RoutineType.SLEEP] ?? RoutineLogStatus.NOT_LOGGED,
      [RoutineType.WATER]: routines?.[RoutineType.WATER] ?? RoutineLogStatus.NOT_LOGGED,
      [RoutineType.EXERCISE]: routines?.[RoutineType.EXERCISE] ?? RoutineLogStatus.NOT_LOGGED,
      [RoutineType.MEAL]: routines?.[RoutineType.MEAL] ?? RoutineLogStatus.NOT_LOGGED,
      [RoutineType.TEETH]: routines?.[RoutineType.TEETH] ?? RoutineLogStatus.NOT_LOGGED,
      [RoutineType.BATH]: routines?.[RoutineType.BATH] ?? RoutineLogStatus.NOT_LOGGED,
    };
    return completeRoutines;
  });

export const dailyProgressSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected APAC-YYYY-MM-DD'),
  satisfaction: z.nativeEnum(SatisfactionLevel),
  notes: z.string(),
  sessions: z.array(stopwatchSessionSchema),
  routines: routinesSchema,
  totalSessionDuration: z.number().min(0),
});

export const scheduledRoutineBaseSchema = baseEntitySchema.merge(completableSchema).extend({
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format, expected HH:mm'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  label: z.string().min(1, 'Label cannot be empty'),
  icon: z.string(),
});

export const sleepRoutineSettingsSchema = z.object({
  wakeTime: z.string().regex(/^\d{2}:\d{2}$/),
  sleepTime: z.string().regex(/^\d{2}:\d{2}$/),
  naps: z.array(scheduledRoutineBaseSchema),
});

export const waterRoutineSettingsSchema = z.object({
  goal: z.number().min(1),
  current: z.number().min(0),
});

export const userRoutineSettingsSchema = z.object({
  sleep: sleepRoutineSettingsSchema.nullable(),
  water: waterRoutineSettingsSchema.nullable(),
  bath: z.array(scheduledRoutineBaseSchema),
  exercise: z.array(scheduledRoutineBaseSchema),
  meal: z.array(scheduledRoutineBaseSchema),
  teeth: z.array(scheduledRoutineBaseSchema),
  lastRoutineResetDate: timestampSchema.nullable(),
});

// --- TOP-LEVEL SCHEMAS ---
export const goalSchema = baseEntitySchema
  .extend({
    name: z.string().min(1, 'Goal name cannot be empty'),
    description: z.string(),
    startDate: timestampSchema,
    endDate: timestampSchema,
    status: z.nativeEnum(GoalStatus),
    dailyProgress: z.record(z.string(), dailyProgressSchema),
    toDoList: z.array(todoItemSchema),
    notToDoList: z.array(distractionItemSchema),
    stickyNotes: z.array(stickyNoteSchema),
    routineSettings: userRoutineSettingsSchema,
    starredQuotes: z.array(z.number().int()),
  })
  .refine(data => data.endDate.toMillis() >= data.startDate.toMillis(), {
    message: 'End date must be after or the same as start date',
    path: ['endDate'],
  });

export const appStateSchema = z.object({
  activeGoalId: z.string().nullable(),
  goals: z.record(z.string(), goalSchema),
});

// --- SCHEMAS FOR JSON IMPORT/EXPORT (using ISO strings for dates) ---
// This schema is used to validate the structure of an imported JSON file.
// It uses a generic `z.any()` for nested objects with timestamps because
// the actual conversion from string to Timestamp is handled by the dataService.
// This schema's primary job is to validate the top-level structure.
export const serializableAppStateSchema = z.object({
  activeGoalId: z.string().nullable(),
  goals: z.record(z.string(), z.any()), // Validate that goals is a record of any type
});

// Zod Schema for TodoEditModal form fields
export const todoEditFormSchema = z.object({
  text: z.string().min(1, 'Task text cannot be empty.').max(200, 'Task text is too long.'),
  description: z.string().max(500, 'Description is too long.').nullable(),
  deadline: z
    .date()
    .nullable()
    .refine(
      date => {
        // Allow null, or if not null, ensure it's a valid date
        return date === null || !isNaN(date.getTime());
      },
      { message: 'Invalid deadline date.' }
    )
    .optional(), // Use optional if the field might not be present on form initialization
});

// Zod Schema for ScheduleEditModal form fields
export const scheduleEditFormSchema = z.object({
  label: z.string().min(1, 'Label cannot be empty.'),
  time: z.date().refine(date => !isNaN(date.getTime()), { message: 'Invalid time selected.' }),
  duration: z.coerce
    .number() // Use coerce to convert string input to number
    .min(1, 'Duration must be at least 1 minute.')
    .max(1440, 'Duration cannot exceed 24 hours (1440 minutes).')
    .int('Duration must be a whole number.'),
  icon: z.string().min(1, 'Icon must be selected.'),
});

// Zod Schema for GoalModal form fields
export const goalFormSchema = z.object({
  name: z.string().min(1, 'Goal name cannot be empty.').max(100, 'Goal name is too long.'),
  description: z.string().max(500, 'Description is too long.'),
  endDate: z
    .date()
    .nullable()
    .refine(
      date => date !== null && !isNaN(date.getTime()), // Must be a valid date
      { message: 'Please select a target date and time.' }
    )
    .refine(
      date => date === null || date.getTime() > new Date().getTime(), // Must be in the future
      { message: 'Target date and time must be in the future.' }
    ),
});

// Zod Schema for DailyProgressModal form fields
export const dailyProgressFormSchema = z.object({
  satisfaction: z.nativeEnum(SatisfactionLevel, {
    errorMap: () => ({ message: 'Please select a satisfaction level.' }),
  }),
  notes: z.string().max(500, 'Notes are too long.').optional().nullable(),
});
