// app/services/transactionService.ts
import { AppState, FinanceData, Transaction } from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { transactionSchema } from '@/utils/schemas';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * @file app/services/transactionService.ts
 * @description Service for managing a goal's financial transactions.
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
 * Adds a new transaction to a goal's finance data.
 * @param userId The current user's ID.
 * @param goalId The goal's ID.
 * @param newTransactionData The data for the new transaction.
 * @returns The newly created Transaction object.
 */
export const addTransaction = async (
  userId: string,
  goalId: string,
  newTransactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Transaction> => {
  const financeData = await getFinanceData(userId, goalId);
  const now = Timestamp.now();
  const newTransaction: Transaction = {
    ...newTransactionData,
    id: generateUUID(),
    createdAt: now,
    updatedAt: now,
  };

  const validation = transactionSchema.safeParse(newTransaction);
  if (!validation.success) {
    throw new ServiceError(
      'New transaction data is invalid.',
      ServiceErrorCode.VALIDATION_FAILED,
      validation.error
    );
  }

  const updatedTransactions = [...financeData.transactions, newTransaction];
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    [`goals.${goalId}.financeData.transactions`]: updatedTransactions,
    [`goals.${goalId}.updatedAt`]: now,
  });

  return newTransaction;
};

/**
 * Updates an existing transaction.
 * @param userId The current user's ID.
 * @param goalId The goal's ID.
 * @param transactionId The ID of the transaction to update.
 * @param updates A partial object of Transaction fields to update.
 */
export const updateTransaction = async (
  userId: string,
  goalId: string,
  transactionId: string,
  updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>
): Promise<void> => {
  const financeData = await getFinanceData(userId, goalId);
  const updatedTransactions = financeData.transactions.map(t =>
    t.id === transactionId ? { ...t, ...updates, updatedAt: Timestamp.now() } : t
  );

  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    [`goals.${goalId}.financeData.transactions`]: updatedTransactions,
    [`goals.${goalId}.updatedAt`]: Timestamp.now(),
  });
};

/**
 * Deletes a transaction.
 * @param userId The current user's ID.
 * @param goalId The goal's ID.
 * @param transactionId The ID of the transaction to delete.
 */
export const deleteTransaction = async (
  userId: string,
  goalId: string,
  transactionId: string
): Promise<void> => {
  const financeData = await getFinanceData(userId, goalId);
  const updatedTransactions = financeData.transactions.filter(t => t.id !== transactionId);

  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    [`goals.${goalId}.financeData.transactions`]: updatedTransactions,
    [`goals.${goalId}.updatedAt`]: Timestamp.now(),
  });
};
