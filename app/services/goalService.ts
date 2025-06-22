// app/services/goalService.ts
import { AppState, Goal, GoalStatus, ScheduledRoutineBase } from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { appStateSchema, goalSchema } from '@/utils/schemas';
import { isSameDay } from 'date-fns';
import {
  Timestamp,
  collection,
  deleteField,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config'; // Import the shared db instance

/**
 * @file app/services/goalService.ts
 * @description Goal and App State Data Service.
 *
 * This module is responsible for all data operations related to the core `Goal`
 * entities and the top-level `AppState` document for a user. It includes logic
 * for fetching, creating, and updating goals, ensuring all data is validated
 * against our Zod schemas upon retrieval.
 */

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
 * It checks if the `lastRoutineResetDate` is before the current day. If so, it resets
 * the completion status of all scheduled routines and the daily water intake.
 * @param appState The current state of the application.
 * @returns An object containing the potentially updated appState and a boolean indicating if an update is needed.
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
 * This is the primary data fetching function for the application.
 * Ensures that a valid AppState is always returned, initializing one if necessary
 * or if fetched data is malformed.
 */
export const getUserData = async (userId: string): Promise<AppState> => {
  const userDocRef = doc(db, 'users', userId);
  try {
    const docSnap = await getDoc(userDocRef);

    // If document does not exist, initialize and save a default AppState
    if (!docSnap.exists()) {
      const defaultState = _initializeDefaultAppState();
      await setDoc(userDocRef, defaultState);
      return defaultState;
    }

    // Attempt to get data; it might be undefined if the document exists but is empty (unlikely with setDoc above, but defensive)
    const rawData = docSnap.data();

    // Validate fetched rawData against the schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validationResult = appStateSchema.safeParse(rawData as any);

    if (!validationResult.success) {
      console.error('Zod Validation Failed: Firestore data is malformed.');
      console.error('Raw data from Firestore:', JSON.stringify(rawData, null, 2)); // Log the raw data
      console.error('Validation errors:', validationResult.error.flatten()); // Log flattened errors
      // If validation fails, return and save a new default state to correct the malformed data
      const defaultState = _initializeDefaultAppState();
      await setDoc(userDocRef, defaultState); // Overwrite malformed data with a valid structure
      return defaultState;
    }

    const validatedData = validationResult.data;

    // Handle daily routine resets
    const { updatedState, needsUpdate } = _handleDailyRoutineResets(validatedData);
    if (needsUpdate) {
      await setDoc(userDocRef, updatedState);
      return updatedState;
    }

    return validatedData;
  } catch (error) {
    // Catch any other errors during the process (e.g., network issues)
    throw new ServiceError('Failed to load user data.', ServiceErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Creates a new goal document.
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
    | 'starredQuotes'
  >
): Promise<Goal> => {
  const userDocRef = doc(db, 'users', userId);
  // Using the userId as a collection and the goalId as the document id for subcollection
  // This is a common pattern when goals are sub-documents of a user.
  const newGoalRef = doc(collection(userDocRef, 'goals'));
  const goalId = newGoalRef.id;

  const goalToCreate: Goal = {
    ...newGoalData,
    id: goalId,
    createdAt: newGoalData.startDate, // Use startDate as initial createdAt
    updatedAt: newGoalData.startDate, // Use startDate as initial updatedAt
    dailyProgress: {},
    toDoList: [],
    notToDoList: [],
    stickyNotes: [],
    routineSettings: {
      sleep: null,
      water: null,
      bath: [],
      exercise: [],
      meal: [],
      teeth: [],
      lastRoutineResetDate: null,
    },
    starredQuotes: [],
  };

  const validation = goalSchema.safeParse(goalToCreate);
  if (!validation.success) {
    // Log the detailed Zod error for debugging
    console.error('Zod validation failed for goal creation:', validation.error.flatten());
    throw new ServiceError(
      'New goal data is invalid.',
      ServiceErrorCode.VALIDATION_FAILED,
      validation.error
    );
  }

  try {
    // Firestore transactions/batches are good for atomicity if multiple writes are dependent.
    // Here we're setting a goal as a subcollection document and updating the main user document.
    const batch = writeBatch(db);
    batch.set(newGoalRef, validation.data); // Set the goal as a sub-document
    batch.update(userDocRef, { [`goals.${goalId}`]: validation.data }); // Add to the map in the main user document
    await batch.commit();
    return validation.data;
  } catch (error) {
    throw new ServiceError('Failed to create new goal.', ServiceErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Updates properties of an existing goal.
 */
export const updateGoal = async (
  userId: string,
  goalId: string,
  updates: Partial<Goal>
): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  const goalDocRef = doc(userDocRef, 'goals', goalId); // Reference to the subcollection document

  // Always update the 'updatedAt' timestamp
  const updatePayload = { ...updates, updatedAt: Timestamp.now() };

  try {
    const batch = writeBatch(db);
    batch.update(goalDocRef, updatePayload); // Update the subcollection document

    // Dynamically create the update path for the goals map in the main user document
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDocUpdatePayload: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(updatePayload)) {
      userDocUpdatePayload[`goals.${goalId}.${key}`] = value;
    }
    batch.update(userDocRef, userDocUpdatePayload); // Update the map in the main user document

    await batch.commit();
  } catch (error) {
    throw new ServiceError(
      `Failed to update goal ${goalId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};

/**
 * Deletes a goal completely from the user's data.
 */
export const deleteGoal = async (userId: string, goalId: string): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  const goalDocRef = doc(userDocRef, 'goals', goalId); // Reference to the subcollection document

  try {
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      // If user doc doesn't exist, nothing to delete regarding goals.
      console.warn(`User document ${userId} not found for goal deletion.`);
      return;
    }
    const appState = userDocSnap.data() as AppState; // Cast to AppState for activeGoalId check

    const batch = writeBatch(db);
    batch.delete(goalDocRef); // Delete the subcollection document

    // Use deleteField to atomically remove the goal from the map in the main user document
    batch.update(userDocRef, { [`goals.${goalId}`]: deleteField() });

    // If the deleted goal was the active one, clear activeGoalId
    if (appState.activeGoalId === goalId) {
      batch.update(userDocRef, { activeGoalId: null });
    }

    await batch.commit();
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
 * This is a destructive operation.
 * @param userId The ID of the user whose data will be reset.
 * @returns A promise that resolves to the new, empty AppState.
 */
export const resetUserData = async (userId: string): Promise<AppState> => {
  const userDocRef = doc(db, 'users', userId);
  const defaultState = _initializeDefaultAppState();
  try {
    // Overwrite the entire document with the default state.
    await setDoc(userDocRef, defaultState);
    return defaultState;
  } catch (error) {
    throw new ServiceError('Failed to reset user data.', ServiceErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Overwrites the entire user data document with new data.
 * Used for the data import feature.
 * @param userId The ID of the user.
 * @param newAppState The complete AppState object to save.
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
