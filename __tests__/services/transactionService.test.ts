/* eslint-disable @typescript-eslint/no-explicit-any */
// __tests__/services/transactionService.test.ts

import * as transactionService from '@/services/transactionService';
import { AppState, FinanceData, Goal, GoalStatus, Transaction } from '@/types';
import { ServiceError } from '@/utils/errors';
import { Timestamp, getDoc, updateDoc } from 'firebase/firestore';

// Mock the config module to prevent real Firebase initialization.
jest.mock('@/services/config', () => ({
  db: { type: 'firestore-mock' },
}));

// A mock document reference object to be returned by the mocked doc function.
const mockDocRef = { type: 'document-reference-mock' };

// Mock the entire 'firebase/firestore' module to isolate the service from the actual database.
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  doc: jest.fn(() => mockDocRef),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

/**
 * @description Test suite for the Transaction Service.
 * This suite validates the core CRUD operations for managing transactions within a goal's finance data.
 */
describe('Transaction Service', () => {
  let mockUserId: string;
  let mockGoalId: string;
  let mockTransaction: Transaction;
  let mockFinanceData: FinanceData;
  let mockAppState: AppState;

  // This block runs before each test to initialize a fresh set of mock data.
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserId = 'test-user-id';
    mockGoalId = 'test-goal-id';

    mockTransaction = {
      id: 'txn-1',
      date: Timestamp.now(),
      amount: 50.0,
      description: 'Groceries',
      budgetId: 'budget-1',
      type: 'expense',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    mockFinanceData = {
      transactions: [mockTransaction],
      budgets: [],
      subscriptions: [],
      assets: [],
      liabilities: [],
      netWorthHistory: [],
    };

    const mockGoal: Goal = {
      id: mockGoalId,
      name: 'Financial Goal',
      description: 'A goal for testing finances',
      startDate: Timestamp.now(),
      endDate: Timestamp.now(),
      status: GoalStatus.ACTIVE,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      dailyProgress: {},
      toDoList: [],
      notToDoList: [],
      stickyNotes: [],
      timeBlocks: [],
      randomPickerItems: [],
      resources: [],
      routineSettings: {} as any,
      wellnessSettings: {} as any,
      starredQuotes: [],
      financeData: mockFinanceData,
    };

    mockAppState = {
      activeGoalId: mockGoalId,
      goals: { [mockGoalId]: mockGoal },
    };
  });

  // Test suite for the addTransaction function.
  describe('addTransaction', () => {
    it("should add a new transaction to the goal's finance data", async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      const newTransactionData = {
        date: Timestamp.now(),
        amount: 12.5,
        description: 'Coffee',
        budgetId: 'budget-2',
        type: 'expense' as const,
      };

      const newTransaction = await transactionService.addTransaction(
        mockUserId,
        mockGoalId,
        newTransactionData
      );

      expect(newTransaction.description).toBe('Coffee');
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedTransactions = updateCall[1][`goals.${mockGoalId}.financeData.transactions`];
      expect(updatedTransactions).toHaveLength(2);
      expect(updatedTransactions[1].description).toBe('Coffee');
    });

    it('should throw a ServiceError if the goal does not have financeData', async () => {
      const appStateWithoutFinance = {
        ...mockAppState,
        goals: {
          ...mockAppState.goals,
          [mockGoalId]: {
            ...mockAppState.goals[mockGoalId],
            financeData: null,
          },
        },
      };
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => appStateWithoutFinance,
      });

      await expect(
        transactionService.addTransaction(mockUserId, mockGoalId, {} as any)
      ).rejects.toThrow(new ServiceError(`Finance data for goal ID ${mockGoalId} not found.`));
    });
  });

  // Test suite for the updateTransaction function.
  describe('updateTransaction', () => {
    it('should update the specified fields of a transaction', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      const updates = { description: 'Weekly Groceries', amount: 75.5 };

      await transactionService.updateTransaction(mockUserId, mockGoalId, 'txn-1', updates);

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedTransactions = updateCall[1][`goals.${mockGoalId}.financeData.transactions`];
      const updatedItem = updatedTransactions.find((t: Transaction) => t.id === 'txn-1');

      expect(updatedItem.description).toBe('Weekly Groceries');
      expect(updatedItem.amount).toBe(75.5);
      expect(updatedItem.updatedAt).toBeDefined();
    });
  });

  // Test suite for the deleteTransaction function.
  describe('deleteTransaction', () => {
    it('should remove the specified transaction from the list', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      await transactionService.deleteTransaction(mockUserId, mockGoalId, 'txn-1');

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedTransactions = updateCall[1][`goals.${mockGoalId}.financeData.transactions`];

      expect(updatedTransactions).toHaveLength(0);
    });
  });
});
