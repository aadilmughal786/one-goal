// app/services/distractionService.ts
import { AppState, DistractionItem } from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * @file app/services/distractionService.ts
 * @description Distraction Item Data Service.
 *
 * This module encapsulates all CRUD (Create, Read, Update, Delete) operations
 * related to the `DistractionItem` entities that are part of a specific goal.
 */

/**
 * A helper to generate a unique ID for a new item on the client-side.
 *
 * **Explanation:**
 * We use client-side ID generation here because a `DistractionItem` is not a
 * separate document in Firestore. It is an object inside the `notToDoList` array, which
 * is a field within the larger `Goal` document.
 *
 * Firestore can only generate unique IDs for top-level documents in a collection.
 * Since this is just an object in an array, we must create our own unique ID to
 * reliably find, update, or delete it later. This contrasts with the `goalService`,
 * where new Goals are created as separate documents.
 *
 * @returns A unique string identifier.
 */
const generateUUID = () => crypto.randomUUID();

/**
 * Adds a new distraction item to a specific goal's list.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal to which the item will be added.
 * @param title The title of the new distraction item.
 * @returns A promise that resolves to the newly created DistractionItem.
 * @throws {ServiceError} If the operation fails.
 */
export const addDistractionItem = async (
  userId: string,
  goalId: string,
  title: string
): Promise<DistractionItem> => {
  const userDocRef = doc(db, 'users', userId);
  try {
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists())
      throw new ServiceError('User data not found.', ServiceErrorCode.NOT_FOUND);

    const appState = docSnap.data() as AppState;
    const currentGoal = appState.goals[goalId];
    if (!currentGoal)
      throw new ServiceError(`Goal with ID ${goalId} not found.`, ServiceErrorCode.NOT_FOUND);

    const now = Timestamp.now();
    const newItem: DistractionItem = {
      id: generateUUID(),
      title: title.trim(),
      description: null,
      triggerPatterns: [],
      count: 0,
      createdAt: now,
      updatedAt: now,
    };

    const updatedNotToDoList = [...(currentGoal.notToDoList || []), newItem];

    await updateDoc(userDocRef, {
      [`goals.${goalId}.notToDoList`]: updatedNotToDoList,
    });

    return newItem;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      'Failed to add distraction item.',
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};

/**
 * Updates an existing distraction item within a goal's list.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal containing the item.
 * @param itemId The ID of the specific item to update.
 * @param updates A partial object of DistractionItem containing the fields to be updated.
 * @throws {ServiceError} If the operation fails.
 */
export const updateDistractionItem = async (
  userId: string,
  goalId: string,
  itemId: string,
  updates: Partial<Omit<DistractionItem, 'id' | 'createdAt'>>
): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  try {
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists())
      throw new ServiceError('User data not found.', ServiceErrorCode.NOT_FOUND);

    const appState = docSnap.data() as AppState;
    const currentGoal = appState.goals[goalId];
    if (!currentGoal)
      throw new ServiceError(`Goal with ID ${goalId} not found.`, ServiceErrorCode.NOT_FOUND);

    const updatedNotToDoList = (currentGoal.notToDoList || []).map(item => {
      if (item.id === itemId) {
        return { ...item, ...updates, updatedAt: Timestamp.now() };
      }
      return item;
    });

    await updateDoc(userDocRef, {
      [`goals.${goalId}.notToDoList`]: updatedNotToDoList,
    });
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      `Failed to update distraction item ${itemId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};

/**
 * Deletes a distraction item from a goal's list.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal containing the item.
 * @param itemId The ID of the item to delete.
 * @throws {ServiceError} If the operation fails.
 */
export const deleteDistractionItem = async (
  userId: string,
  goalId: string,
  itemId: string
): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  try {
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists())
      throw new ServiceError('User data not found.', ServiceErrorCode.NOT_FOUND);

    const appState = docSnap.data() as AppState;
    const currentGoal = appState.goals[goalId];
    if (!currentGoal)
      throw new ServiceError(`Goal with ID ${goalId} not found.`, ServiceErrorCode.NOT_FOUND);

    const updatedNotToDoList = (currentGoal.notToDoList || []).filter(item => item.id !== itemId);

    await updateDoc(userDocRef, {
      [`goals.${goalId}.notToDoList`]: updatedNotToDoList,
    });
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      `Failed to delete distraction item ${itemId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};
