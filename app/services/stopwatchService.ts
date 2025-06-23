// app/services/stopwatchService.ts
import {
  AppState,
  DailyProgress,
  RoutineLogStatus,
  SatisfactionLevel,
  StopwatchSession,
} from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * @file app/services/stopwatchService.ts
 * @description Stopwatch Session Data Service.
 *
 * This module encapsulates all CRUD (Create, Read, Update, Delete) operations
 * related to the `StopwatchSession` entities. It ensures that the denormalized
 * `totalSessionDuration` field in the `DailyProgress` object is always kept in sync.
 */

/**
 * A helper to generate a unique ID for a new item.
 * @returns A unique string identifier.
 */
const generateUUID = () => crypto.randomUUID();

/**
 * Adds a new stopwatch session to a goal's daily progress for a specific date.
 * If no daily progress exists for that day, it creates a default entry first.
 * It also recalculates and updates the `totalSessionDuration`.
 *
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal to which the session will be added.
 * @param sessionData The core data for the new session (label, duration, startTime).
 * @returns A promise that resolves to the newly created, fully-formed StopwatchSession object.
 * @throws {ServiceError} If the operation fails.
 */
export const addStopwatchSession = async (
  userId: string,
  goalId: string,
  sessionData: Omit<StopwatchSession, 'id' | 'createdAt' | 'updatedAt'>
): Promise<StopwatchSession> => {
  const userDocRef = doc(db, 'users', userId);
  try {
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists())
      throw new ServiceError('User data not found.', ServiceErrorCode.NOT_FOUND);

    const appState = docSnap.data() as AppState;
    const goal = appState.goals[goalId];
    if (!goal)
      throw new ServiceError(`Goal with ID ${goalId} not found.`, ServiceErrorCode.NOT_FOUND);

    const now = Timestamp.now();
    const newSession: StopwatchSession = {
      ...sessionData,
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
    };

    const dateKey = newSession.startTime.toDate().toISOString().split('T')[0]; // yyyy-MM-dd
    const existingProgress = goal.dailyProgress[dateKey];

    const updatedSessions = existingProgress
      ? [...existingProgress.sessions, newSession]
      : [newSession];

    const newTotalDuration = updatedSessions.reduce((sum, session) => sum + session.duration, 0);

    // If no progress entry exists for this day, create a default one.
    // FIX: When creating a new daily progress, ensure the `sessions` array is initialized with the new session.
    const updatedDailyProgress: DailyProgress = existingProgress ?? {
      date: dateKey,
      satisfaction: SatisfactionLevel.NEUTRAL,
      notes: '',
      routines: {} as Record<string, RoutineLogStatus>,
      sessions: [newSession], // FIX: Initialize with the new session
      totalSessionDuration: 0,
    };

    // This part correctly updates the sessions array whether it's a new or existing day
    updatedDailyProgress.sessions = updatedSessions;
    updatedDailyProgress.totalSessionDuration = newTotalDuration;

    await updateDoc(userDocRef, {
      [`goals.${goalId}.dailyProgress.${dateKey}`]: updatedDailyProgress,
      [`goals.${goalId}.updatedAt`]: now,
    });

    return newSession;
  } catch (error) {
    throw new ServiceError(
      `Failed to add stopwatch session for goal ${goalId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};

/**
 * Updates the label of an existing stopwatch session.
 * This operation does not affect the total duration.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal containing the session.
 * @param dateKey The date string ('YYYY-MM-DD') of the daily progress entry.
 * @param sessionId The ID of the session to update.
 * @param newLabel The new text for the session's label.
 * @throws {ServiceError} If the operation fails.
 */
export const updateStopwatchSession = async (
  userId: string,
  goalId: string,
  dateKey: string,
  sessionId: string,
  newLabel: string
): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  try {
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists())
      throw new ServiceError('User data not found.', ServiceErrorCode.NOT_FOUND);

    const appState = docSnap.data() as AppState;
    const progress = appState.goals[goalId]?.dailyProgress[dateKey];
    if (!progress)
      throw new ServiceError(`No progress found for date ${dateKey}.`, ServiceErrorCode.NOT_FOUND);

    const updatedSessions = progress.sessions.map(session =>
      session.id === sessionId
        ? { ...session, label: newLabel, updatedAt: Timestamp.now() }
        : session
    );

    await updateDoc(userDocRef, {
      [`goals.${goalId}.dailyProgress.${dateKey}.sessions`]: updatedSessions,
      [`goals.${goalId}.updatedAt`]: Timestamp.now(),
    });
  } catch (error) {
    throw new ServiceError(
      `Failed to update stopwatch session ${sessionId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};

/**
 * Deletes a stopwatch session from a daily progress entry.
 * It also recalculates and updates the `totalSessionDuration`.
 * @param userId The ID of the current user.
 * @param goalId The ID of the goal containing the session.
 * @param dateKey The date string ('YYYY-MM-DD') of the daily progress entry.
 * @param sessionId The ID of the session to delete.
 * @throws {ServiceError} If the operation fails.
 */
export const deleteStopwatchSession = async (
  userId: string,
  goalId: string,
  dateKey: string,
  sessionId: string
): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  try {
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists())
      throw new ServiceError('User data not found.', ServiceErrorCode.NOT_FOUND);

    const appState = docSnap.data() as AppState;
    const progress = appState.goals[goalId]?.dailyProgress[dateKey];
    if (!progress)
      throw new ServiceError(`No progress found for date ${dateKey}.`, ServiceErrorCode.NOT_FOUND);

    const updatedSessions = progress.sessions.filter(session => session.id !== sessionId);

    // Recalculate the total duration after deleting a session.
    const newTotalDuration = updatedSessions.reduce((sum, session) => sum + session.duration, 0);

    await updateDoc(userDocRef, {
      [`goals.${goalId}.dailyProgress.${dateKey}.sessions`]: updatedSessions,
      [`goals.${goalId}.dailyProgress.${dateKey}.totalSessionDuration`]: newTotalDuration,
      [`goals.${goalId}.updatedAt`]: Timestamp.now(),
    });
  } catch (error) {
    throw new ServiceError(
      `Failed to delete stopwatch session ${sessionId}.`,
      ServiceErrorCode.OPERATION_FAILED,
      error
    );
  }
};
