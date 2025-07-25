/* eslint-disable @typescript-eslint/no-explicit-any */
// __tests__/services/budgetService.test.ts

import * as budgetService from '@/services/budgetService';
import { AppState, Budget, BudgetPeriod, FinanceData, Goal, GoalStatus } from '@/types';
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
 * @description Test suite for the Budget Service.
 * This suite validates the core CRUD operations for managing budgets within a goal's finance data.
 */
describe('Budget Service', () => {
  let mockUserId: string;
  let mockGoalId: string;
  let mockBudget: Budget;
  let mockFinanceData: FinanceData;
  let mockAppState: AppState;

  // This block runs before each test to initialize a fresh set of mock data.
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserId = 'test-user-id';
    mockGoalId = 'test-goal-id';

    mockBudget = {
      id: 'budget-1',
      category: 'Groceries',
      amount: 500,
      period: BudgetPeriod.MONTHLY,
      startDate: null,
      endDate: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    mockFinanceData = {
      transactions: [],
      budgets: [mockBudget],
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
      catchingTheFrogTasks: [],
    };

    mockAppState = {
      activeGoalId: mockGoalId,
      goals: { [mockGoalId]: mockGoal },
    };
  });

  // Test suite for the addBudget function.
  describe('addBudget', () => {
    it("should add a new budget to the goal's finance data", async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      const newBudgetData = {
        category: 'Entertainment',
        amount: 100,
        period: BudgetPeriod.MONTHLY,
        startDate: null,
        endDate: null,
      };

      const newBudget = await budgetService.addBudget(mockUserId, mockGoalId, newBudgetData);

      expect(newBudget.category).toBe('Entertainment');
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedBudgets = updateCall[1][`goals.${mockGoalId}.financeData.budgets`];
      expect(updatedBudgets).toHaveLength(2);
      expect(updatedBudgets[1].category).toBe('Entertainment');
    });
  });

  // Test suite for the updateBudget function.
  describe('updateBudget', () => {
    it('should update the specified fields of a budget', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      const updates = { category: 'Food & Groceries', amount: 600 };

      await budgetService.updateBudget(mockUserId, mockGoalId, 'budget-1', updates);

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedBudgets = updateCall[1][`goals.${mockGoalId}.financeData.budgets`];
      const updatedItem = updatedBudgets.find((b: Budget) => b.id === 'budget-1');

      expect(updatedItem.category).toBe('Food & Groceries');
      expect(updatedItem.amount).toBe(600);
      expect(updatedItem.updatedAt).toBeDefined();
    });
  });

  // Test suite for the deleteBudget function.
  describe('deleteBudget', () => {
    it('should remove the specified budget and associated items', async () => {
      // Setup with a transaction linked to the budget
      mockFinanceData.transactions.push({
        id: 'txn-to-delete',
        budgetId: 'budget-1',
        amount: 25,
        description: 'Lunch',
        type: 'expense',
        date: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      await budgetService.deleteBudget(mockUserId, mockGoalId, 'budget-1');

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedBudgets = updateCall[1][`goals.${mockGoalId}.financeData.budgets`];
      const updatedTransactions = updateCall[1][`goals.${mockGoalId}.financeData.transactions`];

      expect(updatedBudgets).toHaveLength(0);
      expect(updatedTransactions).toHaveLength(0);
    });
  });
});
