// app/utils/schemas.ts
import {
  AssetType,
  BudgetPeriod, // NEW: Imported BudgetPeriod enum
  GoalStatus,
  LiabilityType,
  ReminderType,
  ResourceType,
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

export const resourceSchema = baseEntitySchema.extend({
  url: z.string().url('Must be a valid URL'),
  title: z.string().min(1, 'Title cannot be empty'),
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
//                      FINANCE RELATED SCHEMAS
// =================================================================//

export const transactionSchema = baseEntitySchema.extend({
  date: timestampSchema,
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description cannot be empty').max(200, 'Description is too long'),
  // REVISION: Changed from 'category' to 'budgetId' for robust data linking.
  budgetId: z.string().min(1, 'Budget ID cannot be empty'),
  type: z.union([z.literal('income'), z.literal('expense')]),
});

export const budgetSchema = baseEntitySchema
  .extend({
    category: z.string().min(1, 'Category cannot be empty').max(100, 'Category is too long'),
    amount: z.number().positive('Amount must be positive'),
    // REVISION: 'spent' is derived data and has been removed to prevent inconsistency.
    period: z.nativeEnum(BudgetPeriod),
    startDate: timestampSchema.nullable(),
    endDate: timestampSchema.nullable(),
  })
  // REVISION: Added refine to ensure end date is after start date for custom periods.
  .refine(
    data => {
      if (data.period === BudgetPeriod.CUSTOM) {
        return (
          data.startDate && data.endDate && data.endDate.toMillis() >= data.startDate.toMillis()
        );
      }
      return true;
    },
    {
      message: 'End date must be after or the same as start date for custom periods.',
      path: ['endDate'],
    }
  );

export const subscriptionSchema = baseEntitySchema.extend({
  name: z
    .string()
    .min(1, 'Subscription name cannot be empty')
    .max(100, 'Subscription name is too long'),
  amount: z.number().positive('Amount must be positive'),
  billingCycle: z.union([z.literal('monthly'), z.literal('yearly'), z.literal('quarterly')]),
  nextBillingDate: timestampSchema,
  endDate: timestampSchema.nullable(),
  cancellationUrl: z.string().url('Invalid URL').nullable(),
  notes: z.string().nullable(),
  // REVISION: Added budgetId to link subscriptions to a budget.
  budgetId: z.string().min(1, 'Budget ID cannot be empty'),
});

export const assetSchema = baseEntitySchema.extend({
  name: z.string().min(1, 'Asset name cannot be empty').max(100, 'Asset name is too long'),
  amount: z.number().min(0, 'Asset amount cannot be negative'),
  type: z.nativeEnum(AssetType),
  notes: z.string().nullable(),
});

export const liabilitySchema = baseEntitySchema.extend({
  name: z.string().min(1, 'Liability name cannot be empty').max(100, 'Liability name is too long'),
  amount: z.number().min(0, 'Liability amount cannot be negative'),
  type: z.nativeEnum(LiabilityType),
  notes: z.string().nullable(),
});

export const netWorthDataSchema = baseEntitySchema.extend({
  date: timestampSchema,
  totalAssets: z.number(),
  totalLiabilities: z.number(),
  netWorth: z.number(),
});

export const financeDataSchema = z.object({
  transactions: z.array(transactionSchema).default([]),
  budgets: z.array(budgetSchema).default([]),
  subscriptions: z.array(subscriptionSchema).default([]),
  assets: z.array(assetSchema).default([]),
  liabilities: z.array(liabilitySchema).default([]),
  netWorthHistory: z.array(netWorthDataSchema).default([]),
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
    resources: z.array(resourceSchema).default([]),
    // REVISION: Added financeData as an optional property within each goal.
    financeData: financeDataSchema.nullable(),
  })
  .refine(data => data.endDate.toMillis() >= data.startDate.toMillis(), {
    message: 'End date must be after or the same as start date',
    path: ['endDate'],
  });

export const appStateSchema = z.object({
  activeGoalId: z.string().nullable(),
  goals: z.record(z.string(), goalSchema),
  // REVISION: Removed top-level finance schema to nest it within goals.
});

// =================================================================//
//                 FORM & SERIALIZATION SCHEMAS
// =================================================================//

export const serializableGoalSchema = z.any();
export const serializableGoalsArraySchema = z.array(serializableGoalSchema);

export const resourceFormSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL.' }),
  title: z.string().min(1, 'Title cannot be empty.').max(100, 'Title is too long.'),
  type: z.nativeEnum(ResourceType, { required_error: 'Please select a resource type.' }),
});

export const todoEditFormSchema = z.object({
  text: z.string().min(1).max(200),
  description: z.string().max(500).nullable(),
  deadline: z.date().nullable(),
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
  notes: z.string().max(500).nullable(),
  weight: z.coerce.number().positive().nullable(),
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

// --- NEW FINANCE FORM SCHEMAS ---

export const transactionFormSchema = z.object({
  date: z.date(),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description cannot be empty').max(200, 'Description is too long'),
  budgetId: z.string().min(1, 'A budget must be selected'),
  type: z.union([z.literal('income'), z.literal('expense')]),
});

export const budgetFormSchema = z
  .object({
    category: z.string().min(1, 'Category cannot be empty').max(100, 'Category is too long'),
    amount: z.coerce.number().positive('Amount must be positive'),
    period: z.nativeEnum(BudgetPeriod),
    startDate: z.date().nullable(),
    endDate: z.date().nullable(),
  })
  .refine(
    data => {
      if (data.period === BudgetPeriod.CUSTOM) {
        return data.startDate && data.endDate && data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message:
        'For custom periods, start and end dates are required, and end date must be after start date.',
      path: ['endDate'],
    }
  );

export const subscriptionFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Subscription name cannot be empty')
    .max(100, 'Subscription name is too long'),
  amount: z.coerce.number().positive('Amount must be positive'),
  billingCycle: z.union([z.literal('monthly'), z.literal('yearly'), z.literal('quarterly')]),
  nextBillingDate: z.date(),
  endDate: z.date().nullable(),
  cancellationUrl: z.string().url('Invalid URL').or(z.literal('')).nullable(),
  notes: z.string().nullable(),
  budgetId: z.string().min(1, 'A budget must be selected'),
});

export const assetFormSchema = z.object({
  name: z.string().min(1, 'Asset name cannot be empty').max(100, 'Asset name is too long'),
  amount: z.coerce.number().min(0, 'Asset amount cannot be negative'),
  type: z.nativeEnum(AssetType),
  notes: z.string().nullable(),
});

export const liabilityFormSchema = z.object({
  name: z.string().min(1, 'Liability name cannot be empty').max(100, 'Liability name is too long'),
  amount: z.coerce.number().min(0, 'Liability amount cannot be negative'),
  type: z.nativeEnum(LiabilityType),
  notes: z.string().nullable(),
});
