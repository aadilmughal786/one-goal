// app/services/budgetService.ts
import { AppState, Budget, FinanceData } from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { budgetSchema } from '@/utils/schemas';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * @file app/services/budgetService.ts
 * @description Service for managing a goal's budgets.
 */

const generateUUID = () => crypto.randomUUID();

/**
 * A private helper to retrieve the finance data for a given goal.
 * This ensures we are always working with the most current state.
 */
const getFinanceData = async (userId: string, goalId: string): Promise<FinanceData> => {
  const userDocRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userDocRef);

  if (!docSnap.exists()) {
    throw new ServiceError('User data not found.', ServiceErrorCode.NOT_FOUND);
  }

  const appState = docSnap.data() as AppState;
  const goal = appState.goals[goalId];

  if (!goal) {
    throw new ServiceError(`Goal with ID ${goalId} not found.`, ServiceErrorCode.NOT_FOUND);
  }

  return (
    goal.financeData || {
      transactions: [],
      budgets: [],
      subscriptions: [],
      assets: [],
      liabilities: [],
      netWorthHistory: [],
    }
  );
};

/**
 * Adds a new budget to a goal's finance data.
 * @param userId The current user's ID.
 * @param goalId The goal's ID.
 * @param newBudgetData The data for the new budget.
 * @returns The newly created Budget object.
 */
export const addBudget = async (
  userId: string,
  goalId: string,
  newBudgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Budget> => {
  const financeData = await getFinanceData(userId, goalId);
  const now = Timestamp.now();
  const newBudget: Budget = {
    ...newBudgetData,
    id: generateUUID(),
    createdAt: now,
    updatedAt: now,
  };

  const validation = budgetSchema.safeParse(newBudget);
  if (!validation.success) {
    throw new ServiceError(
      'New budget data is invalid.',
      ServiceErrorCode.VALIDATION_FAILED,
      validation.error
    );
  }

  const updatedBudgets = [...financeData.budgets, newBudget];
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    [`goals.${goalId}.financeData.budgets`]: updatedBudgets,
    [`goals.${goalId}.updatedAt`]: now,
  });

  return newBudget;
};

/**
 * Updates an existing budget.
 * @param userId The current user's ID.
 * @param goalId The goal's ID.
 * @param budgetId The ID of the budget to update.
 * @param updates A partial object of Budget fields to update.
 */
export const updateBudget = async (
  userId: string,
  goalId: string,
  budgetId: string,
  updates: Partial<Omit<Budget, 'id' | 'createdAt'>>
): Promise<void> => {
  const financeData = await getFinanceData(userId, goalId);
  const updatedBudgets = financeData.budgets.map(b =>
    b.id === budgetId ? { ...b, ...updates, updatedAt: Timestamp.now() } : b
  );

  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    [`goals.${goalId}.financeData.budgets`]: updatedBudgets,
    [`goals.${goalId}.updatedAt`]: Timestamp.now(),
  });
};

/**
 * Deletes a budget and all associated transactions and subscriptions.
 * @param userId The current user's ID.
 * @param goalId The goal's ID.
 * @param budgetId The ID of the budget to delete.
 */
export const deleteBudget = async (
  userId: string,
  goalId: string,
  budgetId: string
): Promise<void> => {
  const financeData = await getFinanceData(userId, goalId);
  const updatedBudgets = financeData.budgets.filter(b => b.id !== budgetId);
  const updatedTransactions = financeData.transactions.filter(t => t.budgetId !== budgetId);
  const updatedSubscriptions = financeData.subscriptions.filter(s => s.budgetId !== budgetId);

  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    [`goals.${goalId}.financeData.budgets`]: updatedBudgets,
    [`goals.${goalId}.financeData.transactions`]: updatedTransactions,
    [`goals.${goalId}.financeData.subscriptions`]: updatedSubscriptions,
    [`goals.${goalId}.updatedAt`]: Timestamp.now(),
  });
};
