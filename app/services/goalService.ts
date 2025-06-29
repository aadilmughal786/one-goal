// app/services/goalService.ts
import { AppState, Goal, GoalStatus, ReminderType, ScheduledRoutineBase } from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { appStateSchema, goalSchema } from '@/utils/schemas';
import { isSameDay } from 'date-fns';
import { Timestamp, deleteField, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * @file app/services/goalService.ts
 * @description Goal and App State Data Service.
 */

// Helper to generate a unique ID on the client side.
const generateUUID = () => crypto.randomUUID();

/**
 * Initializes a default, empty AppState object for a new user.
 * @returns An empty AppState object.
 */
const _initializeDefaultAppState = (): AppState => ({
  activeGoalId: null,
  goals: {},
});

/**
 * A helper function that handles the daily reset of routines for all active goals.
 */
const _handleDailyRoutineResets = (
  appState: AppState
): { updatedState: AppState; needsUpdate: boolean } => {
  const now = new Date();
  let needsUpdate = false;
  const updatedGoals = { ...appState.goals };

  for (const goalId in updatedGoals) {
    const goal = updatedGoals[goalId];
    if (goal.status === GoalStatus.ACTIVE) {
      const lastReset = goal.routineSettings.lastRoutineResetDate?.toDate();

      if (!lastReset || !isSameDay(lastReset, now)) {
        let goalWasModified = false;

        const resetSchedules = (schedules: ScheduledRoutineBase[]) =>
          schedules.map(s => {
            if (s.completed) {
              goalWasModified = true;
              return { ...s, completed: false, completedAt: null, updatedAt: Timestamp.now() };
            }
            return s;
          });

        const settings = goal.routineSettings;
        settings.bath = resetSchedules(settings.bath);
        settings.exercise = resetSchedules(settings.exercise);
        settings.meal = resetSchedules(settings.meal);
        settings.teeth = resetSchedules(settings.teeth);
        if (settings.sleep) {
          settings.sleep.naps = resetSchedules(settings.sleep.naps);
        }

        if (settings.water && settings.water.current > 0) {
          settings.water.current = 0;
          goalWasModified = true;
        }

        if (goalWasModified) {
          settings.lastRoutineResetDate = Timestamp.fromDate(now);
          goal.updatedAt = Timestamp.fromDate(now);
          needsUpdate = true;
        }
      }
    }
  }

  return { updatedState: { ...appState, goals: updatedGoals }, needsUpdate };
};

/**
 * Retrieves the entire user data document (`AppState`) from Firestore.
 */
export const getUserData = async (userId: string): Promise<AppState> => {
  const userDocRef = doc(db, 'users', userId);
  try {
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      const defaultState = _initializeDefaultAppState();
      await setDoc(userDocRef, defaultState);
      return defaultState;
    }

    const rawData = docSnap.data();
    const validationResult = appStateSchema.safeParse(rawData);

    if (!validationResult.success) {
      console.error(
        'Zod Validation Failed: Firestore data is malformed.',
        validationResult.error.flatten()
      );

      const flattenedErrors = validationResult.error.flatten().fieldErrors;
      const errorDetails = Object.entries(flattenedErrors)
        .map(([path, messages]) => {
          const goalIdMatch = path.match(/goals\.(.*?)\./);
          const goalId = goalIdMatch ? goalIdMatch[1] : null;
          const goalName = goalId ? (rawData as AppState)?.goals[goalId]?.name : null;
          const goalContext = goalName ? `in Goal "${goalName}"` : '';
          const field = path.substring(path.lastIndexOf('.') + 1);
          return `Field '${field}' ${goalContext} is invalid: ${messages.join('. ')}`;
        })
        .join('; ');

      throw new ServiceError(
        `Data validation failed. ${errorDetails}`,
        ServiceErrorCode.VALIDATION_FAILED,
        validationResult.error,
        rawData
      );
    }

    const validatedData = validationResult.data;
    const { updatedState, needsUpdate } = _handleDailyRoutineResets(validatedData);
    if (needsUpdate) {
      await setDoc(userDocRef, updatedState);
      return updatedState;
    }

    return validatedData;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError('Failed to load user data.', ServiceErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Creates a new goal and adds it to the user's main data document.
 */
export const createGoal = async (
  userId: string,
  newGoalData: Omit<
    Goal,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'dailyProgress'
    | 'toDoList'
    | 'notToDoList'
    | 'stickyNotes'
    | 'routineSettings'
    | 'wellnessSettings' // <-- Exclude new settings from input type
    | 'starredQuotes'
  >
): Promise<Goal> => {
  const userDocRef = doc(db, 'users', userId);
  const goalId = generateUUID();
  const now = Timestamp.now();

  const goalToCreate: Goal = {
    ...newGoalData,
    id: goalId,
    createdAt: now,
    updatedAt: now,
    dailyProgress: {},
    toDoList: [],
    notToDoList: [],
    stickyNotes: [],
    routineSettings: {
      sleep: { wakeTime: '06:00', sleepTime: '22:00', naps: [] },
      water: { goal: 8, current: 0 },
      bath: [],
      exercise: [],
      meal: [],
      teeth: [],
      lastRoutineResetDate: null,
    },
    // Add default wellness settings for a new goal
    wellnessSettings: {
      [ReminderType.WATER]: { enabled: false, frequency: 60 },
      [ReminderType.EYE_CARE]: { enabled: false, frequency: 45 },
      [ReminderType.STRETCH]: { enabled: false, frequency: 90 },
      [ReminderType.BREAK]: { enabled: false, frequency: 60 },
    },
    starredQuotes: [],
  };

  const validation = goalSchema.safeParse(goalToCreate);
  if (!validation.success) {
    console.error('Zod validation failed for goal creation:', validation.error.flatten());
    throw new ServiceError(
      'New goal data is invalid.',
      ServiceErrorCode.VALIDATION_FAILED,
      validation.error
    );
  }

  try {
    await updateDoc(userDocRef, {
      [`goals.${goalId}`]: validation.data,
    });

    const userDoc = await getDoc(userDocRef);
    const appState = userDoc.data() as AppState;
    if (Object.keys(appState.goals).length === 1 && !appState.activeGoalId) {
      await updateDoc(userDocRef, { activeGoalId: goalId });
    }

    return validation.data;
  } catch (error) {
    throw new ServiceError('Failed to create new goal.', ServiceErrorCode.OPERATION_FAILED, error);
  }
};

type GoalUpdatePayload = { [key: string]: unknown };

/**
 * Updates properties of an existing goal within the user's main document.
 */
export const updateGoal = async (
  userId: string,
  goalId: string,
  updates: Partial<Goal>
): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  const updatePayload = { ...updates, updatedAt: Timestamp.now() };

  const userDocUpdatePayload: GoalUpdatePayload = {};
  for (const [key, value] of Object.entries(updatePayload)) {
    userDocUpdatePayload[`goals.${goalId}.${key}`] = value;
  }

  try {
    await updateDoc(userDocRef, userDocUpdatePayload);
  } catch (error) {
    throw new ServiceError(
      `Failed to update goal ${goalId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};

/**
 * Deletes a goal from the user's main data document.
 */
export const deleteGoal = async (userId: string, goalId: string): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  try {
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      console.warn(`User document ${userId} not found for goal deletion.`);
      return;
    }
    const appState = userDocSnap.data() as AppState;

    const updatePayload: GoalUpdatePayload = {
      [`goals.${goalId}`]: deleteField(),
    };

    if (appState.activeGoalId === goalId) {
      updatePayload.activeGoalId = null;
    }

    await updateDoc(userDocRef, updatePayload);
  } catch (error) {
    throw new ServiceError(
      `Failed to delete goal ${goalId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};

/**
 * Sets the active goal for the user.
 */
export const setActiveGoal = async (userId: string, goalId: string | null): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  try {
    await updateDoc(userDocRef, { activeGoalId: goalId });
  } catch (error) {
    throw new ServiceError('Failed to set active goal.', ServiceErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Resets all data for a user back to the initial, empty state.
 */
export const resetUserData = async (userId: string): Promise<AppState> => {
  const userDocRef = doc(db, 'users', userId);
  const defaultState = _initializeDefaultAppState();
  try {
    await setDoc(userDocRef, defaultState);
    return defaultState;
  } catch (error) {
    throw new ServiceError('Failed to reset user data.', ServiceErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Overwrites the entire user data document with new data.
 */
export const setUserData = async (userId: string, newAppState: AppState): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  try {
    await setDoc(userDocRef, newAppState);
  } catch (error) {
    throw new ServiceError(
      'Failed to set user data during import.',
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};
