// app/services/timeBlockService.ts
import { AppState, TimeBlock } from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * @file app/services/timeBlockService.ts
 * @description Time Block Data Service.
 *
 * This module encapsulates all CRUD (Create, Read, Update, Delete) operations
 * related to the `TimeBlock` entities that are part of a specific goal.
 */

const generateUUID = () => crypto.randomUUID();

/**
 * Adds a new time block to a specific goal's list.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal to which the block will be added.
 * @param label The label for the new time block.
 * @param startTime The start time of the block in "HH:mm" format.
 * @param endTime The end time of the block in "HH:mm" format.
 * @param color The color for the block.
 * @returns A promise that resolves to the newly created TimeBlock.
 * @throws {ServiceError} If the operation fails.
 */
export const addTimeBlock = async (
  userId: string,
  goalId: string,
  label: string,
  startTime: string,
  endTime: string,
  color: string
): Promise<TimeBlock> => {
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
    const newItem: TimeBlock = {
      id: generateUUID(),
      label: label.trim(),
      startTime: startTime,
      endTime: endTime,
      color: color,
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const updatedTimeBlocks = [...(currentGoal.timeBlocks || []), newItem];

    await updateDoc(userDocRef, {
      [`goals.${goalId}.timeBlocks`]: updatedTimeBlocks,
    });

    return newItem;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError('Failed to add time block.', ServiceErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Updates an existing time block within a goal's list.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal containing the block.
 * @param blockId The ID of the specific block to update.
 * @param updates A partial object of TimeBlock containing the fields to be updated.
 * @throws {ServiceError} If the operation fails.
 */
export const updateTimeBlock = async (
  userId: string,
  goalId: string,
  blockId: string,
  updates: Partial<Omit<TimeBlock, 'id' | 'createdAt'>>
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

    const updatedTimeBlocks = (currentGoal.timeBlocks || []).map(block => {
      if (block.id === blockId) {
        return { ...block, ...updates, updatedAt: Timestamp.now() };
      }
      return block;
    });

    await updateDoc(userDocRef, {
      [`goals.${goalId}.timeBlocks`]: updatedTimeBlocks,
    });
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      `Failed to update time block ${blockId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};

/**
 * Deletes a time block from a goal's list.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal containing the block.
 * @param blockId The ID of the block to delete.
 * @throws {ServiceError} If the operation fails.
 */
export const deleteTimeBlock = async (
  userId: string,
  goalId: string,
  blockId: string
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

    const updatedTimeBlocks = (currentGoal.timeBlocks || []).filter(block => block.id !== blockId);

    await updateDoc(userDocRef, {
      [`goals.${goalId}.timeBlocks`]: updatedTimeBlocks,
    });
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      `Failed to delete time block ${blockId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};
