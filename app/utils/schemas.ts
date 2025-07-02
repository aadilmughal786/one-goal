// app/utils/schemas.ts
import {
  GoalStatus,
  ReminderType,
  ResourceType, // NEW
  RoutineLogStatus,
  RoutineType,
  SatisfactionLevel,
  StickyNoteColor,
} from '@/types';
import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

const timestampSchema = z.instanceof(Timestamp, { message: 'Invalid Firestore Timestamp' });

// =================================================================//
//                      BASE SCHEMAS
// =================================================================//

const baseEntitySchema = z.object({
  id: z.string().min(1, 'ID cannot be empty'),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

const completableSchema = z.object({
  completed: z.boolean(),
  completedAt: timestampSchema.nullable(),
});

// =================================================================//
//                      CORE DOMAIN ENTITIES
// =================================================================//

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

export const timeBlockSchema = baseEntitySchema.merge(completableSchema).extend({
  label: z.string().min(1, 'Time block label cannot be empty'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  color: z.string().min(1, 'Color cannot be empty'),
});

// NEW: Schema for a single resource
export const resourceSchema = baseEntitySchema.extend({
  url: z.string().url('Must be a valid URL'),
  title: z.string().min(1, 'Title cannot be empty'),
  description: z.string().nullable(),
  type: z.nativeEnum(ResourceType),
});

// =================================================================//
//                   ROUTINES & PROGRESS TRACKING
// =================================================================//

export const stopwatchSessionSchema = baseEntitySchema.extend({
  startTime: timestampSchema,
  label: z.string().min(1, 'Session label cannot be empty'),
  duration: z.number().min(0),
});

const routinesSchema = z
  .record(z.nativeEnum(RoutineType), z.nativeEnum(RoutineLogStatus))
  .optional()
  .default({})
  .transform(routines => ({
    [RoutineType.SLEEP]: routines?.[RoutineType.SLEEP] ?? RoutineLogStatus.NOT_LOGGED,
    [RoutineType.WATER]: routines?.[RoutineType.WATER] ?? RoutineLogStatus.NOT_LOGGED,
    [RoutineType.EXERCISE]: routines?.[RoutineType.EXERCISE] ?? RoutineLogStatus.NOT_LOGGED,
    [RoutineType.MEAL]: routines?.[RoutineType.MEAL] ?? RoutineLogStatus.NOT_LOGGED,
    [RoutineType.TEETH]: routines?.[RoutineType.TEETH] ?? RoutineLogStatus.NOT_LOGGED,
    [RoutineType.BATH]: routines?.[RoutineType.BATH] ?? RoutineLogStatus.NOT_LOGGED,
  }));

export const dailyProgressSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  satisfaction: z.nativeEnum(SatisfactionLevel),
  notes: z.string(),
  sessions: z.array(stopwatchSessionSchema),
  routines: routinesSchema,
  totalSessionDuration: z.number().min(0),
  weight: z.number().positive().nullable(),
});

export const scheduledRoutineBaseSchema = baseEntitySchema.merge(completableSchema).extend({
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().min(1),
  label: z.string().min(1),
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

export const reminderSettingSchema = z.object({
  enabled: z.boolean(),
  frequency: z.number().int().min(1),
});

export const wellnessSettingsSchema = z.object({
  [ReminderType.WATER]: reminderSettingSchema,
  [ReminderType.EYE_CARE]: reminderSettingSchema,
  [ReminderType.STRETCH]: reminderSettingSchema,
  [ReminderType.BREAK]: reminderSettingSchema,
  [ReminderType.POSTURE]: reminderSettingSchema,
});

// =================================================================//
//                        TOP-LEVEL STATE
// =================================================================//

export const goalSchema = baseEntitySchema
  .extend({
    name: z.string().min(1),
    description: z.string().min(1).max(500),
    startDate: timestampSchema,
    endDate: timestampSchema,
    status: z.nativeEnum(GoalStatus),
    dailyProgress: z.record(z.string(), dailyProgressSchema),
    toDoList: z.array(todoItemSchema),
    notToDoList: z.array(distractionItemSchema),
    stickyNotes: z.array(stickyNoteSchema),
    routineSettings: userRoutineSettingsSchema,
    wellnessSettings: wellnessSettingsSchema,
    starredQuotes: z.array(z.number().int()),
    timeBlocks: z.array(timeBlockSchema).default([]),
    randomPickerItems: z.array(z.string()).default([]),
    resources: z.array(resourceSchema).default([]), // NEW: Add resources schema to Goal
  })
  .refine(data => data.endDate.toMillis() >= data.startDate.toMillis(), {
    message: 'End date must be after or the same as start date',
    path: ['endDate'],
  });

export const appStateSchema = z.object({
  activeGoalId: z.string().nullable(),
  goals: z.record(z.string(), goalSchema),
});

// =================================================================//
//                 FORM & SERIALIZATION SCHEMAS
// =================================================================//

export const serializableGoalSchema = z.any();
export const serializableGoalsArraySchema = z.array(serializableGoalSchema);

// NEW: Schema for the AddResourceModal form
export const resourceFormSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL.' }),
  title: z.string().min(1, 'Title cannot be empty.').max(100, 'Title is too long.'),
  description: z.string().max(280, 'Description is too long.').nullable(),
  type: z.nativeEnum(ResourceType, { required_error: 'Please select a resource type.' }),
});

export const todoEditFormSchema = z.object({
  text: z.string().min(1).max(200),
  description: z.string().max(500).nullable(),
  deadline: z.date().nullable().optional(),
});

export const scheduleEditFormSchema = z.object({
  label: z.string().min(1),
  time: z.date(),
  duration: z.coerce.number().min(1).max(1440).int(),
  icon: z.string().min(1),
});

export const goalFormSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  endDate: z.date().min(new Date()),
});

export const dailyProgressFormSchema = z.object({
  satisfaction: z.nativeEnum(SatisfactionLevel),
  notes: z.string().max(500).optional().nullable(),
  weight: z.coerce.number().positive().optional().nullable(),
});

export const distractionEditFormSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  triggerPatterns: z.string().max(500).nullable(),
});

export const timeBlockFormSchema = z
  .object({
    label: z.string().min(1),
    startTime: z.date(),
    endTime: z.date(),
    color: z.string(),
  })
  .refine(data => data.endTime > data.startTime, {
    message: 'End time must be after start time.',
    path: ['endTime'],
  });
