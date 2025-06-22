// app/services/stickyNoteService.ts
import { AppState, StickyNote, StickyNoteColor } from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * @file app/services/stickyNoteService.ts
 * @description Sticky Note Data Service.
 *
 * This module encapsulates all CRUD (Create, Read, Update, Delete) operations
 * related to the `StickyNote` entities that are part of a specific goal.
 */

/**
 * A helper to generate a unique ID for a new item on the client-side.
 * Since a StickyNote is an object within an array inside a Goal document,
 * we must generate its ID on the client.
 * @returns A unique string identifier.
 */
const generateUUID = () => crypto.randomUUID();

/**
 * Adds a new sticky note to a specific goal's list.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal to which the note will be added.
 * @param title The title of the new sticky note.
 * @param content The content of the new sticky note.
 * @param color The color of the new sticky note.
 * @returns A promise that resolves to the newly created StickyNote.
 * @throws {ServiceError} If the operation fails.
 */
export const addStickyNote = async (
  userId: string,
  goalId: string,
  title: string,
  content: string,
  color: StickyNoteColor
): Promise<StickyNote> => {
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
    const newItem: StickyNote = {
      id: generateUUID(),
      title: title.trim(),
      content: content.trim(),
      color: color,
      createdAt: now,
      updatedAt: now,
    };

    const updatedStickyNotes = [...(currentGoal.stickyNotes || []), newItem];

    await updateDoc(userDocRef, {
      [`goals.${goalId}.stickyNotes`]: updatedStickyNotes,
    });

    return newItem;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError('Failed to add sticky note.', ServiceErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Updates an existing sticky note within a goal's list.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal containing the note.
 * @param itemId The ID of the specific note to update.
 * @param updates A partial object of StickyNote containing the fields to be updated.
 * @throws {ServiceError} If the operation fails.
 */
export const updateStickyNote = async (
  userId: string,
  goalId: string,
  itemId: string,
  updates: Partial<Omit<StickyNote, 'id' | 'createdAt'>>
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

    const updatedStickyNotes = (currentGoal.stickyNotes || []).map(item => {
      if (item.id === itemId) {
        return { ...item, ...updates, updatedAt: Timestamp.now() };
      }
      return item;
    });

    await updateDoc(userDocRef, {
      [`goals.${goalId}.stickyNotes`]: updatedStickyNotes,
    });
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      `Failed to update sticky note ${itemId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};

/**
 * Deletes a sticky note from a goal's list.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal containing the note.
 * @param itemId The ID of the note to delete.
 * @throws {ServiceError} If the operation fails.
 */
export const deleteStickyNote = async (
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

    const updatedStickyNotes = (currentGoal.stickyNotes || []).filter(item => item.id !== itemId);

    await updateDoc(userDocRef, {
      [`goals.${goalId}.stickyNotes`]: updatedStickyNotes,
    });
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      `Failed to delete sticky note ${itemId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};
