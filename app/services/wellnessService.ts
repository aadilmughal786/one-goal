// app/services/wellnessService.ts
import { WellnessSettings } from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * @file app/services/wellnessService.ts
 * @description Wellness Reminder Settings Data Service.
 */

/**
 * Updates the wellness settings object for a specific goal.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal whose settings are being updated.
 * @param wellnessSettings The complete, updated WellnessSettings object.
 * @throws {ServiceError} If the update operation fails.
 */
export const updateWellnessSettings = async (
  userId: string,
  goalId: string,
  wellnessSettings: WellnessSettings
): Promise<void> => {
  if (!userId || !goalId) {
    throw new ServiceError(
      'User ID and Goal ID are required to update wellness settings.',
      ServiceErrorCode.INVALID_INPUT
    );
  }
  const userDocRef = doc(db, 'users', userId);
  try {
    await updateDoc(userDocRef, {
      [`goals.${goalId}.wellnessSettings`]: wellnessSettings,
    });
  } catch (error) {
    throw new ServiceError(
      'Failed to update wellness settings in Firestore.',
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};
