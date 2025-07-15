// app/services/subscriptionService.ts
import { AppState, FinanceData, Subscription } from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { subscriptionSchema } from '@/utils/schemas';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * @file app/services/subscriptionService.ts
 * @description Service for managing a goal's recurring subscriptions.
 */

const generateUUID = () => crypto.randomUUID();

/**
 * A private helper to retrieve the finance data for a given goal.
 */
const getFinanceData = async (userId: string, goalId: string): Promise<FinanceData> => {
  const userDocRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userDocRef);

  if (!docSnap.exists()) {
    throw new ServiceError('User data not found.', ServiceErrorCode.NOT_FOUND);
  }

  const appState = docSnap.data() as AppState;
  const goal = appState.goals[goalId];

  if (!goal || !goal.financeData) {
    throw new ServiceError(
      `Finance data for goal ID ${goalId} not found.`,
      ServiceErrorCode.NOT_FOUND
    );
  }
  return goal.financeData;
};

/**
 * Adds a new subscription to a goal's finance data.
 * @param userId The current user's ID.
 * @param goalId The goal's ID.
 * @param newSubscriptionData The data for the new subscription.
 * @returns The newly created Subscription object.
 */
export const addSubscription = async (
  userId: string,
  goalId: string,
  newSubscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Subscription> => {
  const financeData = await getFinanceData(userId, goalId);
  const now = Timestamp.now();
  const newSubscription: Subscription = {
    ...newSubscriptionData,
    id: generateUUID(),
    createdAt: now,
    updatedAt: now,
  };

  const validation = subscriptionSchema.safeParse(newSubscription);
  if (!validation.success) {
    throw new ServiceError(
      'New subscription data is invalid.',
      ServiceErrorCode.VALIDATION_FAILED,
      validation.error
    );
  }

  const updatedSubscriptions = [...financeData.subscriptions, newSubscription];
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    [`goals.${goalId}.financeData.subscriptions`]: updatedSubscriptions,
    [`goals.${goalId}.updatedAt`]: now,
  });

  return newSubscription;
};

/**
 * Updates an existing subscription.
 * @param userId The current user's ID.
 * @param goalId The goal's ID.
 * @param subscriptionId The ID of the subscription to update.
 * @param updates A partial object of Subscription fields to update.
 */
export const updateSubscription = async (
  userId: string,
  goalId: string,
  subscriptionId: string,
  updates: Partial<Omit<Subscription, 'id' | 'createdAt'>>
): Promise<void> => {
  const financeData = await getFinanceData(userId, goalId);
  const updatedSubscriptions = financeData.subscriptions.map(s =>
    s.id === subscriptionId ? { ...s, ...updates, updatedAt: Timestamp.now() } : s
  );

  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    [`goals.${goalId}.financeData.subscriptions`]: updatedSubscriptions,
    [`goals.${goalId}.updatedAt`]: Timestamp.now(),
  });
};

/**
 * Deletes a subscription.
 * @param userId The current user's ID.
 * @param goalId The goal's ID.
 * @param subscriptionId The ID of the subscription to delete.
 */
export const deleteSubscription = async (
  userId: string,
  goalId: string,
  subscriptionId: string
): Promise<void> => {
  const financeData = await getFinanceData(userId, goalId);
  const updatedSubscriptions = financeData.subscriptions.filter(s => s.id !== subscriptionId);

  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    [`goals.${goalId}.financeData.subscriptions`]: updatedSubscriptions,
    [`goals.${goalId}.updatedAt`]: Timestamp.now(),
  });
};
