// app/services/todoService.ts
import { AppState, TodoItem } from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * @file app/services/todoService.ts
 * @description To-Do Item Data Service.
 *
 * This module encapsulates all CRUD (Create, Read, Update, Delete) operations
 * related to the `TodoItem` entities that are part of a specific goal.
 */

/**
 * A helper to generate a unique ID for a new item.
 * In a real-world scenario, you might use a more robust library, but crypto.randomUUID is sufficient here.
 * @returns A unique string identifier.
 */
const generateUUID = () => crypto.randomUUID();

/**
 * Adds a new to-do item to a specific goal's list.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal to which the to-do will be added.
 * @param text The text content of the new to-do item.
 * @returns A promise that resolves to the newly created TodoItem.
 * @throws {ServiceError} If the goal or user document is not found, or the update fails.
 */
export const addTodoItem = async (
  userId: string,
  goalId: string,
  text: string
): Promise<TodoItem> => {
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
    const newItem: TodoItem = {
      id: generateUUID(),
      text: text.trim(),
      description: null,
      order: 0, // New items are added to the top
      completed: false,
      completedAt: null,
      deadline: null,
      createdAt: now,
      updatedAt: now,
    };

    // Prepend the new item and re-order the existing items
    const updatedToDoList = [
      newItem,
      ...(currentGoal.toDoList || []).map(item => ({ ...item, order: item.order + 1 })),
    ];

    await updateDoc(userDocRef, {
      [`goals.${goalId}.toDoList`]: updatedToDoList,
    });

    return newItem;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError('Failed to add to-do item.', ServiceErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Updates an existing to-do item within a goal's list.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal containing the to-do item.
 * @param itemId The ID of the specific to-do item to update.
 * @param updates A partial object of TodoItem containing the fields to be updated.
 * @throws {ServiceError} If the operation fails.
 */
export const updateTodoItem = async (
  userId: string,
  goalId: string,
  itemId: string,
  updates: Partial<Omit<TodoItem, 'id' | 'createdAt'>>
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

    const updatedToDoList = (currentGoal.toDoList || []).map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates, updatedAt: Timestamp.now() };
        // Automatically handle completedAt timestamp
        if (updates.completed !== undefined) {
          updatedItem.completedAt = updates.completed ? Timestamp.now() : null;
        }
        return updatedItem;
      }
      return item;
    });

    await updateDoc(userDocRef, {
      [`goals.${goalId}.toDoList`]: updatedToDoList,
    });
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      `Failed to update to-do item ${itemId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};

/**
 * Deletes a to-do item from a goal's list.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal containing the to-do item.
 * @param itemId The ID of the to-do item to delete.
 * @throws {ServiceError} If the operation fails.
 */
export const deleteTodoItem = async (
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

    const updatedToDoList = (currentGoal.toDoList || []).filter(item => item.id !== itemId);

    await updateDoc(userDocRef, {
      [`goals.${goalId}.toDoList`]: updatedToDoList,
    });
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      `Failed to delete to-do item ${itemId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};

/**
 * Replaces the entire to-do list for a goal with a new, reordered list.
 * This is typically used after a drag-and-drop operation.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal whose list is being reordered.
 * @param reorderedList The full, reordered array of TodoItems.
 * @throws {ServiceError} If the operation fails.
 */
export const updateTodoListOrder = async (
  userId: string,
  goalId: string,
  reorderedList: TodoItem[]
): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  try {
    // Ensure all items have an up-to-date 'updatedAt' timestamp
    const listWithTimestamps = reorderedList.map(item => ({ ...item, updatedAt: Timestamp.now() }));

    await updateDoc(userDocRef, {
      [`goals.${goalId}.toDoList`]: listWithTimestamps,
    });
  } catch (error) {
    throw new ServiceError(
      `Failed to reorder to-do list for goal ${goalId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};
