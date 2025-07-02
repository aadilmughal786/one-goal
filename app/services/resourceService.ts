// app/services/resourceService.ts
import { AppState, Resource, ResourceType } from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * @file app/services/resourceService.ts
 * @description Service for managing a goal's resources (links, images, etc.).
 */

const generateUUID = () => crypto.randomUUID();

/**
 * Adds a new resource to a goal's list.
 * @param userId The current user's ID.
 * @param goalId The goal's ID.
 * @param url The URL of the resource.
 * @param title The title of the resource.
 * @param description An optional description.
 * @param type The type of the resource.
 * @returns The newly created Resource.
 */
export const addResource = async (
  userId: string,
  goalId: string,
  url: string,
  title: string,
  description: string | null,
  type: ResourceType
): Promise<Resource> => {
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
    const newItem: Resource = {
      id: generateUUID(),
      url,
      title,
      description,
      type,
      createdAt: now,
      updatedAt: now,
    };

    const updatedResources = [...(currentGoal.resources || []), newItem];

    await updateDoc(userDocRef, {
      [`goals.${goalId}.resources`]: updatedResources,
    });

    return newItem;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError('Failed to add resource.', ServiceErrorCode.OPERATION_FAILED, error);
  }
};

/**
 * Updates an existing resource.
 * @param userId The current user's ID.
 * @param goalId The goal's ID.
 * @param resourceId The ID of the resource to update.
 * @param updates A partial object of Resource fields to update.
 */
export const updateResource = async (
  userId: string,
  goalId: string,
  resourceId: string,
  updates: Partial<Omit<Resource, 'id' | 'createdAt'>>
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

    const updatedResources = (currentGoal.resources || []).map(item => {
      if (item.id === resourceId) {
        return { ...item, ...updates, updatedAt: Timestamp.now() };
      }
      return item;
    });

    await updateDoc(userDocRef, {
      [`goals.${goalId}.resources`]: updatedResources,
    });
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      `Failed to update resource ${resourceId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};

/**
 * Deletes a resource from a goal's list.
 * @param userId The current user's ID.
 * @param goalId The goal's ID.
 * @param resourceId The ID of the resource to delete.
 */
export const deleteResource = async (
  userId: string,
  goalId: string,
  resourceId: string
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

    const updatedResources = (currentGoal.resources || []).filter(item => item.id !== resourceId);

    await updateDoc(userDocRef, {
      [`goals.${goalId}.resources`]: updatedResources,
    });
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      `Failed to delete resource ${resourceId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};
