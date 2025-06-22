// app/services/quoteService.ts
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * @file app/services/quoteService.ts
 * @description Quote Management Service.
 *
 * This module handles all data operations related to starring and unstarring
 * quotes for a specific goal. It uses atomic array update operations for safety.
 */

/**
 * Adds a quote's ID to a goal's list of starred quotes.
 * Uses Firestore's `arrayUnion` to safely add the ID without creating duplicates.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal to which the starred quote will be added.
 * @param quoteId The numeric ID of the quote to star.
 * @throws {ServiceError} If the update operation fails.
 */
export const addStarredQuote = async (
  userId: string,
  goalId: string,
  quoteId: number
): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  try {
    await updateDoc(userDocRef, {
      [`goals.${goalId}.starredQuotes`]: arrayUnion(quoteId),
    });
  } catch (error) {
    throw new ServiceError('Failed to star quote.', ServiceErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Removes a quote's ID from a goal's list of starred quotes.
 * Uses Firestore's `arrayRemove` to safely remove all instances of the ID.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal from which the starred quote will be removed.
 * @param quoteId The numeric ID of the quote to unstar.
 * @throws {ServiceError} If the update operation fails.
 */
export const removeStarredQuote = async (
  userId: string,
  goalId: string,
  quoteId: number
): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  try {
    await updateDoc(userDocRef, {
      [`goals.${goalId}.starredQuotes`]: arrayRemove(quoteId),
    });
  } catch (error) {
    throw new ServiceError('Failed to unstar quote.', ServiceErrorCode.OPERATION_FAILED, error);
  }
};
