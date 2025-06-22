// app/services/routineService.ts
import { DailyProgress, UserRoutineSettings } from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * @file app/services/routineService.ts
 * @description Routine and Daily Progress Data Service.
 *
 * This module handles all data operations related to a user's routines and their
 * daily progress logs within a specific goal. It does NOT handle specific item
 * types like To-Dos or Stopwatch sessions, which have their own services.
 */

/**
 * Updates the entire routine settings object for a specific goal.
 * This is a generic function designed to handle updates for any routine type
 * (sleep, water, exercise, etc.) by overwriting the settings object.
 *
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal whose routines are being updated.
 * @param newSettings The complete, updated UserRoutineSettings object.
 * @throws {ServiceError} If the update operation fails.
 */
export const updateRoutineSettings = async (
  userId: string,
  goalId: string,
  newSettings: UserRoutineSettings
): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  try {
    await updateDoc(userDocRef, {
      [`goals.${goalId}.routineSettings`]: newSettings,
      [`goals.${goalId}.updatedAt`]: Timestamp.now(), // Also update the goal's timestamp
    });
  } catch (error) {
    throw new ServiceError(
      'Failed to update routine settings.',
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};

/**
 * Saves or updates a daily progress log for a specific date and goal.
 * If a log for the given date already exists, it merges the new data.
 * If not, it creates a new log.
 *
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal to log progress against.
 * @param progressData The daily progress data to save. It must include the date.
 * @throws {ServiceError} If the operation fails.
 */
export const saveDailyProgress = async (
  userId: string,
  goalId: string,
  progressData: DailyProgress
): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  try {
    const dateKey = progressData.date; // The date string 'YYYY-MM-DD'
    if (!dateKey) {
      throw new ServiceError('Progress data must include a date.', ServiceErrorCode.INVALID_INPUT);
    }

    // The dot notation allows us to update a specific entry in the dailyProgress map.
    await updateDoc(userDocRef, {
      [`goals.${goalId}.dailyProgress.${dateKey}`]: progressData,
      [`goals.${goalId}.updatedAt`]: Timestamp.now(), // Also update the goal's timestamp
    });
  } catch (error) {
    throw new ServiceError(
      `Failed to save daily progress for goal ${goalId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};
